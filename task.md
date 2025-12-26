# Admin Settings Disconnect & UI Refactor

- [x] Debug disconnect between /admin/settings and admin_settings.json
- [x] Fix falsy overrides in AdminSettingsService
- [x] Implement dynamic settings reloading in CognitiveOrchestrator
- [x] Verify settings persistence and reloading
- [x] Refactor Admin UI Consolidation
    - [x] Create consolidated `/admin` page with tabs
    - [x] Fix "narrow frame" layout for settings
    - [x] Update routes in `App.tsx`
    - [x] Update `JosoorV2Page` sidebar
    - [x] Add return link to Admin header
    - [x] Verify consolidated UI
- [ ] Restore full database connectivity
    - [ ] Locate PostgreSQL Password
    - [ ] Update .env with PGPASSWORD
    - [ ] Verify full database connection
- [ ] Address MCP Server issues
    - [ ] Investigate MCP Server Error (405)
