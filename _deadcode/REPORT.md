# Dead Code Sweep Report
Generated: 2026-09-01T13:59:50.647Z

## Summary
- Files scanned: 522
- Orphan files moved to _deadcode/: 41
- Unused exports flagged (NOT deleted — file kept): 103
- Dangling imports after move: 0 (verified)

## Moved Files (orphan — zero importers, not entry points)

| # | Original path |
|---|---|
| 1 | src/components/ProtectedRoute.jsx |
| 2 | src/components/hub/useLunarSolar.jsx |
| 3 | src/components/reasoning/EvidenceList.jsx |
| 4 | src/components/reasoning/FieldDecisionCard.jsx |
| 5 | src/components/ui/alert-dialog.jsx |
| 6 | src/components/ui/alert.jsx |
| 7 | src/components/ui/aspect-ratio.jsx |
| 8 | src/components/ui/avatar.jsx |
| 9 | src/components/ui/badge.jsx |
| 10 | src/components/ui/breadcrumb.jsx |
| 11 | src/components/ui/calendar.jsx |
| 12 | src/components/ui/card.jsx |
| 13 | src/components/ui/carousel.jsx |
| 14 | src/components/ui/chart.jsx |
| 15 | src/components/ui/checkbox.jsx |
| 16 | src/components/ui/collapsible.jsx |
| 17 | src/components/ui/command.jsx |
| 18 | src/components/ui/context-menu.jsx |
| 19 | src/components/ui/drawer.jsx |
| 20 | src/components/ui/dropdown-menu.jsx |
| 21 | src/components/ui/form.jsx |
| 22 | src/components/ui/hover-card.jsx |
| 23 | src/components/ui/menubar.jsx |
| 24 | src/components/ui/navigation-menu.jsx |
| 25 | src/components/ui/pagination.jsx |
| 26 | src/components/ui/popover.jsx |
| 27 | src/components/ui/progress.jsx |
| 28 | src/components/ui/radio-group.jsx |
| 29 | src/components/ui/resizable.jsx |
| 30 | src/components/ui/scroll-area.jsx |
| 31 | src/components/ui/select.jsx |
| 32 | src/components/ui/sidebar.jsx |
| 33 | src/components/ui/slider.jsx |
| 34 | src/components/ui/sonner.jsx |
| 35 | src/components/ui/switch.jsx |
| 36 | src/components/ui/table.jsx |
| 37 | src/components/ui/tabs.jsx |
| 38 | src/components/ui/toggle-group.jsx |
| 39 | src/lib/useDeviceOrientation.js |
| 40 | src/lib/useMousePosition.js |
| 41 | src/pages/OAuthConsent.jsx |

## Unused Exports (flagged, not removed)

These exported symbols are never imported by any other file. The containing file is still in use, so only the export is flagged — nothing was deleted. Review and prune manually if desired.

- src/components/HotspotProximityWatcher.jsx::STORAGE_KEY
- src/components/HotspotProximityWatcher.jsx::TODAY
- src/components/HotspotProximityWatcher.jsx::getDismissed
- src/components/HotspotProximityWatcher.jsx::saveDismissed
- src/components/HotspotProximityWatcher.jsx::formatDistance
- src/components/HotspotProximityWatcher.jsx::useHotspotAnalytics
- src/components/HotspotProximityWatcher.jsx::useAutoDismiss
- src/components/HotspotProximityWatcher.jsx::useScrollDismiss
- src/components/HotspotProximityWatcher.jsx::HotspotProximityBanner
- src/components/Layout.jsx::getActiveTab
- src/components/ar/AREncounterScreen.jsx::useARCamera
- src/components/ar/AREncounterScreen.jsx::EncounterTopBar
- src/components/ar/AREncounterScreen.jsx::EncounterOrb
- src/components/ar/AREncounterScreen.jsx::EncounterResultCard
- src/components/badges/LiquidMineralBadge.jsx::MATERIAL_DEFS
- src/components/chronolith/ObservationForm.jsx::buildObservationsPayload
- src/components/collection/CollectionDashboard.jsx::RARITY_COLORS
- src/components/collection/CollectionDashboard.jsx::computeRarityData
- src/components/collection/CollectionDashboard.jsx::computeTopMinerals
- src/components/collection/CollectionDashboard.jsx::computeWeeklyFinds
- src/components/collection/CollectionDashboard.jsx::computeGeoStates
- src/components/collection/CollectionDashboard.jsx::computeRarestFinds
- src/components/collection/CollectionDashboard.jsx::computeSummaryStats
- src/components/collection/CollectionDashboard.jsx::computeCollectionStats
- src/components/explore/HotspotMap.jsx::LAND_COLORS
- src/components/explore/HotspotMap.jsx::getHotspotIcon
- src/components/explore/HotspotMap.jsx::getSpecimenIcon
- src/components/explore/HotspotMap.jsx::getUserIcon
- src/components/hub/ChaosModeToggle.jsx::setParentalChaosLock
- src/components/hub/OpeningBuffer.jsx::getDeviceId
- src/components/market/HeatMapBanner.jsx::drawHeat
- src/components/ui/button.jsx::buttonVariants
- src/components/ui/dialog.jsx::Dialog
- src/components/ui/dialog.jsx::DialogPortal
- src/components/ui/dialog.jsx::DialogOverlay
- src/components/ui/dialog.jsx::DialogTrigger
- src/components/ui/dialog.jsx::DialogClose
- src/components/ui/dialog.jsx::DialogContent
- src/components/ui/dialog.jsx::DialogHeader
- src/components/ui/dialog.jsx::DialogFooter
- src/components/ui/dialog.jsx::DialogTitle
- src/components/ui/dialog.jsx::DialogDescription
- src/components/ui/input-otp.jsx::InputOTPSeparator
- src/components/ui/separator.jsx::Separator
- src/components/ui/sheet.jsx::Sheet
- src/components/ui/sheet.jsx::SheetPortal
- src/components/ui/sheet.jsx::SheetOverlay
- src/components/ui/sheet.jsx::SheetTrigger
- src/components/ui/sheet.jsx::SheetClose
- src/components/ui/sheet.jsx::SheetContent
- src/components/ui/sheet.jsx::SheetHeader
- src/components/ui/sheet.jsx::SheetFooter
- src/components/ui/sheet.jsx::SheetTitle
- src/components/ui/sheet.jsx::SheetDescription
- src/components/ui/skeleton.jsx::Skeleton
- src/components/ui/toast.jsx::ToastAction
- src/components/ui/toggle.jsx::Toggle
- src/components/ui/toggle.jsx::toggleVariants
- src/components/ui/tooltip.jsx::TooltipTrigger
- src/components/ui/tooltip.jsx::TooltipContent
- src/components/ui/tooltip.jsx::TooltipProvider
- src/components/ui/use-toast.jsx::reducer
- src/components/visuals/SkeletonCard.jsx::SkeletonCard
- src/hooks/use-mobile.jsx::useIsMobile
- src/lib/accessibilityUtils.jsx::applySafeAnimation
- src/lib/accessibilityUtils.jsx::announceToScreen
- src/lib/accessibilityUtils.jsx::KEYMAP
- src/lib/accessibilityUtils.jsx::createFocusTrap
- src/lib/accessibilityUtils.jsx::SkipToMainLink
- src/lib/accessibilityUtils.jsx::generateAltText
- src/lib/accessibilityUtils.jsx::createAccessibleLabel
- src/lib/accessibilityUtils.jsx::captureVoiceInput
- src/lib/accessibilityUtils.jsx::triggerHaptic
- src/lib/accessibilityUtils.jsx::runA11yTests
- src/lib/app-params.js::isTokenKey
- src/lib/app-params.js::getStorageBackend
- src/lib/app-params.js::clearStoredAuthTokens
- src/lib/app-params.js::getSafeRedirectUrl
- src/lib/app-params.js::getAppParamValue
- src/lib/chronolithUploads.js::MAX_CHRONOLITH_FILES
- src/lib/mineralRules.js::MINERAL_RULES
- src/lib/mineralRules.js::buildFactBase
- src/lib/mineralRules.js::runRules
- src/lib/mineralRules.js::computeDeductiveScore
- src/lib/mineralStories.js::MINERAL_STORIES
- src/lib/modelCache.js::getCachedModel
- src/lib/modelCache.js::putCachedModel
- src/lib/modelCache.js::sha256Hex
- src/lib/modelCache.js::fetchAndCacheModel
- src/lib/performanceOptimization.js::lazyLoadImages
- src/lib/performanceOptimization.js::batchDOMUpdates
- src/lib/performanceOptimization.js::scheduleWork
- src/lib/performanceOptimization.js::detectMemoryLeaks
- src/lib/performanceOptimization.js::getImageUrl
- src/lib/reasoningEngine.js::bandLabel
- src/lib/reasoningEngine.js::highLevelPlan
- src/lib/reasoningEngine.js::recommendAction
- src/lib/reasoningEngine.js::reason
- src/lib/utils.js::isIframe
- src/pages/Admin.jsx::clearAllHotspots
- src/pages/Leaderboard.jsx::computeSortedRanks
- src/pages/Leaderboard.jsx::filterRows
- src/pages/QuestDashboard.jsx::QuestCard

## Restore
To restore any moved file, copy it back from `_deadcode/<original-path>` to its original location.