import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * crawlMindat — admin-only crawler that pulls mineral species from mindat.org
 * and enriches each entry with structured fields via InvokeLLM, then bulk-creates
 * Mineral records in the database.
 *
 * Strategy:
 *  1. Fetch mindat.org's alphabetic mineral index page(s) — public HTML.
 *  2. Extract { name, mindat_url } pairs via regex (no DOM needed in Deno).
 *  3. For each batch, fetch individual species pages and use InvokeLLM with a
 *     JSON schema to extract { formula, crystal_system, hardness, color, luster,
 *     streak, description, rarity, category } + multi-grade image refs.
 *  4. Bulk-create into Mineral entity via service role.
 *
 * Payload:
 *   {
 *     letter?: string,           // 'A'..'Z', default 'A'
 *     limit?: number,            // max minerals to ingest in this run, default 50
 *     offset?: number,           // skip N from the letter index, default 0
 *     dryRun?: boolean           // if true, return parsed data without writing
 *   }
 *
 * Returns: { created, skipped, errors, sample }
 *
 * NOTE: Crawl politely. Run repeatedly with different letters/offsets to build
 *   up to 2000+ minerals over time rather than in one shot.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const letter = (body.letter || 'A').toUpperCase().slice(0, 1);
    const limit = Math.min(Math.max(parseInt(body.limit) || 50, 1), 100);
    const offset = Math.max(parseInt(body.offset) || 0, 0);
    const dryRun = !!body.dryRun;

    // 1. Fetch mindat alphabetical index for this letter
    const indexUrl = `https://www.mindat.org/strunz.php?a=${letter}`;
    const indexRes = await fetch(indexUrl, {
      headers: { 'User-Agent': 'RockHoundGO/1.0 (mineral catalog builder)' },
    });
    if (!indexRes.ok) {
      // Fallback to the standard species index
      return await crawlSpeciesIndex(base44, letter, limit, offset, dryRun);
    }
    const html = await indexRes.text();

    // Extract mineral name + page links: pattern like <a href="/min-1234.html">Name</a>
    const linkRe = /<a[^>]+href="(\/min-\d+\.html)"[^>]*>([^<]{2,80})<\/a>/g;
    const seen = new Set();
    const candidates = [];
    let m;
    while ((m = linkRe.exec(html)) !== null) {
      const url = `https://www.mindat.org${m[1]}`;
      const name = decodeHtml(m[2]).trim();
      if (!name || seen.has(name)) continue;
      // Skip obvious non-mineral entries
      if (/^[\d\s.,]+$/.test(name)) continue;
      if (name.length < 2) continue;
      seen.add(name);
      candidates.push({ name, url });
    }

    const slice = candidates.slice(offset, offset + limit);
    if (slice.length === 0) {
      return Response.json({
        created: 0, skipped: 0, errors: [],
        message: `No more minerals for letter ${letter} at offset ${offset}.`,
        totalFound: candidates.length,
      });
    }

    // 2. Skip ones already in the DB (by name)
    const existing = await base44.asServiceRole.entities.Mineral.list();
    const existingNames = new Set(existing.map(x => (x.name || '').toLowerCase()));

    // 3. For each candidate, fetch detail page + extract structured data in parallel
    const created = [];
    const errors = [];
    const toFetch = slice.filter(c => !existingNames.has(c.name.toLowerCase()));
    const fetchedResults = await Promise.all(
      toFetch.map(async (c) => {
        try {
          const detail = await fetchAndParseMineral(base44, c);
          if (!detail) return { name: c.name, reason: 'parse_failed' };
          return { detail };
        } catch (e) {
          return { name: c.name, reason: String(e.message || e) };
        }
      })
    );
    for (const res of fetchedResults) {
      if (res.detail) {
        created.push(res.detail);
      } else {
        errors.push({ name: res.name, reason: res.reason });
      }
    }

    if (dryRun) {
      return Response.json({
        created: 0, skipped: 0, errors, sample: created.slice(0, 3),
        wouldCreate: created.length, totalFound: candidates.length,
      });
    }

    // 4. Bulk insert
    let writeCount = 0;
    if (created.length) {
      // chunk into 25s to be safe
      for (let i = 0; i < created.length; i += 25) {
        const chunk = created.slice(i, i + 25);
        await base44.asServiceRole.entities.Mineral.bulkCreate(chunk);
        writeCount += chunk.length;
      }
    }

    return Response.json({
      created: writeCount,
      skipped: slice.length - created.length - errors.length,
      errors,
      sample: created.slice(0, 3),
      letter, offset, nextOffset: offset + limit,
      totalFound: candidates.length,
    });
  } catch (error) {
    // Never return a stack trace to the client — it leaks internal paths and
    // module layout. Log it server-side instead.
    console.error('crawlMindat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Fallback: parse mindat species list (used if strunz page is restricted)
async function crawlSpeciesIndex(base44, letter, limit, offset, dryRun) {
  const url = `https://www.mindat.org/index-${letter}.html`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RockHoundGO/1.0 (mineral catalog builder)' },
  });
  if (!res.ok) {
    return Response.json({ error: `mindat index returned ${res.status}` }, { status: 502 });
  }
  const html = await res.text();
  const linkRe = /<a[^>]+href="(\/min-\d+\.html)"[^>]*>([^<]{2,80})<\/a>/g;
  const seen = new Set();
  const candidates = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const u = `https://www.mindat.org${m[1]}`;
    const name = decodeHtml(m[2]).trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    candidates.push({ name, url: u });
  }
  const slice = candidates.slice(offset, offset + limit);

  const existing = await base44.asServiceRole.entities.Mineral.list();
  const existingNames = new Set(existing.map(x => (x.name || '').toLowerCase()));

  const created = [];
  const errors = [];
  const toFetchFallback = slice.filter(c => !existingNames.has(c.name.toLowerCase()));
  const fallbackResults = await Promise.all(
    toFetchFallback.map(async (c) => {
      try {
        const detail = await fetchAndParseMineral(base44, c);
        if (!detail) return { name: c.name, reason: 'parse_failed' };
        return { detail };
      } catch (e) {
        return { name: c.name, reason: String(e.message || e) };
      }
    })
  );
  for (const res of fallbackResults) {
    if (res.detail) {
      created.push(res.detail);
    } else {
      errors.push({ name: res.name, reason: res.reason });
    }
  }

  if (!dryRun && created.length) {
    for (let i = 0; i < created.length; i += 25) {
      await base44.asServiceRole.entities.Mineral.bulkCreate(created.slice(i, i + 25));
    }
  }

  return Response.json({
    created: dryRun ? 0 : created.length,
    skipped: slice.length - created.length - errors.length,
    errors, sample: created.slice(0, 3),
    letter, offset, nextOffset: offset + limit,
    totalFound: candidates.length,
    fallback: true,
  });
}

async function fetchAndParseMineral(base44, candidate) {
  const res = await fetch(candidate.url, {
    headers: { 'User-Agent': 'RockHoundGO/1.0' },
  });
  if (!res.ok) return null;
  const html = await res.text();

  // Extract a content slice — the data table region of mindat pages.
  // We pass a trimmed version to the LLM to keep token use sane.
  const trimmed = trimHtml(html, 18000);

  // Try to capture a primary thumbnail (museum-grade reference)
  const imgMatch = html.match(/<img[^>]+src="([^"]+\/photos\/[^"]+\.(?:jpg|jpeg|png|webp))"/i);
  const primaryImage = imgMatch ? absolutize(imgMatch[1]) : null;

  // Capture multiple photo references for grade variety
  const allImgRe = /<img[^>]+src="([^"]+\/photos\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi;
  const refs = [];
  let im;
  while ((im = allImgRe.exec(html)) !== null && refs.length < 6) {
    const u = absolutize(im[1]);
    if (!refs.includes(u)) refs.push(u);
  }

  // Use InvokeLLM to extract structured fields from the page text
  const schema = {
    type: 'object',
    properties: {
      formula: { type: 'string' },
      crystal_system: { type: 'string' },
      hardness: { type: 'string' },
      color: { type: 'string' },
      luster: { type: 'string' },
      streak: { type: 'string' },
      description: { type: 'string' },
      rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
      category: { type: 'string' },
    },
  };
  const prompt =
    `Extract mineralogical data for "${candidate.name}" from the HTML below. ` +
    `Return concise values. For description, write 2 sentences max. ` +
    `Estimate rarity from how broadly it occurs. Category should be a Strunz/Dana class like "Silicate", "Sulfide", "Oxide".\n\n` +
    `HTML:\n${trimmed}`;

  let extracted = {};
  try {
    extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });
  } catch {
    extracted = {};
  }

  return {
    name: candidate.name,
    formula: extracted.formula || '',
    crystal_system: extracted.crystal_system || '',
    hardness: extracted.hardness || '',
    color: extracted.color || '',
    luster: extracted.luster || '',
    streak: extracted.streak || '',
    description: extracted.description || '',
    rarity: ['common', 'uncommon', 'rare', 'legendary'].includes(extracted.rarity)
      ? extracted.rarity : 'common',
    category: extracted.category || '',
    image_url: primaryImage || '',
    // Stash multi-grade refs in the description when no dedicated field exists.
    // (Schema doesn't have refs[], so we encode them at the end of description.)
    ...(refs.length > 1 ? {
      description: ((extracted.description || '') + `\n\nReference photos: ${refs.join(', ')}`).trim(),
    } : {}),
  };
}

function trimHtml(html, max) {
  // Strip script/style and truncate
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  return cleaned.slice(0, max);
}

function absolutize(u) {
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return 'https:' + u;
  if (u.startsWith('/')) return 'https://www.mindat.org' + u;
  return u;
}

function decodeHtml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }