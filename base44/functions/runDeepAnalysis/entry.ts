import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { isValidImageUrl } from '../../shared/imageUrlValidation.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { image_url, quick_result, lat, lng } = await req.json();

    if (image_url && !isValidImageUrl(image_url)) {
      return Response.json({ error: 'image_url must be from a trusted storage domain' }, { status: 400 });
    }

    // Fetch local bedrock geology for locality plausibility
    let geologyContext = '';
    if (lat && lng) {
      try {
        const geoResp = await fetch(
          `https://macrostrat.org/api/v2/geologic_units/map?lat=${lat}&lng=${lng}&format=json`
        );
        const geoData = await geoResp.json();
        if (geoData?.success?.data?.length > 0) {
          const units = geoData.success.data
            .slice(0, 3)
            .map((u) => `${u.name || u.mindat_name || 'unknown'} (${u.age_text || '?'})`)
            .join('; ');
          geologyContext = ` Local bedrock geology at this location: ${units}.`;
        }
      } catch {}
    }

    const r = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt:
        'You are a deep mineral analysis expert performing Stage 3 of a tri-lateral identification pipeline. ' +
        'Given this specimen photo and the Stage 2 quick identification, provide comprehensive deep analysis.\n\n' +
        `Quick ID: ${quick_result?.top_match || 'Unknown'} (confidence: ${quick_result?.confidence || 0})\n` +
        `Scientific name: ${quick_result?.scientific_name || 'N/A'}\n` +
        `Formula: ${quick_result?.chemical_formula || 'N/A'}\n` +
        `Hardness: ${quick_result?.hardness_mohs || 'N/A'}\n` +
        `Crystal system: ${quick_result?.crystal_system || 'N/A'}\n` +
        `Rarity: ${quick_result?.rarity || 'N/A'}\n` +
        `${geologyContext}\n\n` +
        'Provide:\n' +
        '1. final_id — confirmed mineral name with full scientific name\n' +
        '2. confidence — calibrated confidence 0-1 (may differ from quick ID if deeper analysis changes the conclusion)\n' +
        '3. locality_plausibility — 0-1 score for whether this mineral is plausible for the GPS region\n' +
        '4. locality_explanation — 1-2 sentences explaining the plausibility score\n' +
        '5. lookalikes_ruled_out — array of {name, why_eliminated} for the top 2-3 confusable minerals\n' +
        '6. reasoning — detailed "why we think this" citing specific visual features, crystallographic evidence, and geological context\n' +
        '7. valuation — {estimate: "$X-Y range", comps: [2-3 comparable specimen sales or listings with source], market_trend: "rising"/"stable"/"falling", trend_explanation: 1 sentence}\n' +
        '8. education_links — array of {title, url} — 2-3 curated, reputable education resources (mindat.org, webmineral.com, or university mineral databases ONLY — no commercial or spam sites)\n\n' +
        'Be specific and thorough. If valuation data is limited, provide a rough estimate based on specimen quality and rarity.',
      file_urls: image_url ? [image_url] : undefined,
      response_json_schema: {
        type: 'object',
        properties: {
          final_id: { type: 'string' },
          confidence: { type: 'number' },
          locality_plausibility: { type: 'number' },
          locality_explanation: { type: 'string' },
          lookalikes_ruled_out: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                why_eliminated: { type: 'string' },
              },
            },
          },
          reasoning: { type: 'string' },
          valuation: {
            type: 'object',
            properties: {
              estimate: { type: 'string' },
              comps: { type: 'array', items: { type: 'string' } },
              market_trend: { type: 'string' },
              trend_explanation: { type: 'string' },
            },
          },
          education_links: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string' },
              },
            },
          },
        },
      },
    });

    return Response.json({ deep_analysis: r });
  } catch (error) {
    console.error('runDeepAnalysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});