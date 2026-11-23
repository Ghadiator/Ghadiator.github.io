/* Legacy compatibility script retained because the pinned static export
 * includes this URL on existing pages.
 *
 * The native PublicShell already renders Failure Lab under
 * GOVERNANCE > Run-time controls beside Context Engineering. Previously
 * this script waited 2300 ms and reparented that link after Architecture
 * under OVERVIEW. The delayed DOM mutation made the sidebar visibly jump
 * after each page load and moved a React-owned node outside its rendered
 * group. It also risked hydration/remount inconsistencies.
 *
 * Do not mutate or relocate navigation elements here. The native shell
 * and future atomic exports are the single source of truth for placement.
 */
(() => { "use strict"; })();
