warning: in the working copy of 'src/pages/ApplyLeavePage.tsx', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/src/pages/ApplyLeavePage.tsx b/src/pages/ApplyLeavePage.tsx[m
[1mindex 0d75085..9afede2 100644[m
[1m--- a/src/pages/ApplyLeavePage.tsx[m
[1m+++ b/src/pages/ApplyLeavePage.tsx[m
[36m@@ -22,10 +22,30 @@[m [mconst leaveCategories = {[m
   other: ['terminal', 'other'] as LeaveType[],[m
 };[m
 [m
[31m-const leaveCategoryLabels: Record<keyof typeof leaveCategories, string> = {[m
[31m-  regular: 'Regular Leave',[m
[31m-  special: 'Special Leave',[m
[31m-  other: 'Other',[m
[32m+[m[32m// ---------------------------------------------------------------------------[m
[32m+[m[32m// Short "at a glance" duration/notice label shown beside each leave type in[m
[32m+[m[32m// the Select dropdown, so users don't have to open a type first to learn its[m
[32m+[m[32m// limit. Mirrors leaveDateRules below (minAdvanceDays/maxDurationDays), but[m
[32m+[m[32m// kept as its own map since a couple of types (e.g. sick leave, which is[m
[32m+[m[32m// allowRetroactive but also filed in advance) read better with custom text[m
[32m+[m[32m// than a mechanically-derived one.[m
[32m+[m[32m// ---------------------------------------------------------------------------[m
[32m+[m[32mconst leaveTypeDurationLabels: Partial<Record<LeaveType, string>> = {[m
[32m+[m[32m  vacation: '5 days notice',[m
[32m+[m[32m  sick: 'upon return',[m
[32m+[m[32m  special_privilege: '3 days',[m
[32m+[m[32m  forced: '5 days',[m
[32m+[m[32m  maternity: '105 days',[m
[32m+[m[32m  paternity: '7 days',[m
[32m+[m[32m  solo_parent: '7 days',[m
[32m+[m[32m  study: '6 months',[m
[32m+[m[32m  vawc: '10 days',[m
[32m+[m[32m  rehabilitation: '6 months',[m
[32m+[m[32m  special_emergency: '5 days',[m
[32m+[m[32m  calamity: '5 days',[m
[32m+[m[32m  adoption: '—',[m
[32m+[m[32m  terminal: '—',[m
[32m+[m[32m  other: '—',[m
 };[m
 [m
 // ---------------------------------------------------------------------------[m
[36m@@ -126,25 +146,6 @@[m [mconst leaveDateRules: Partial<Record<LeaveType, LeaveDateRule>> = {[m
   },[m
 };[m
 [m
[31m-// Short duration labels shown in the Leave Types sidebar, next to each item.[m
[31m-const leaveTypeDurations: Partial<Record<LeaveType, string>> = {[m
[31m-  vacation: '5 days notice',[m
[31m-  sick: 'File anytime',[m
[31m-  special_privilege: 'Up to 3 days',[m
[31m-  forced: '5 days / year',[m
[31m-  maternity: 'Up to 105 days',[m
[31m-  paternity: 'Up to 7 days',[m
[31m-  solo_parent: 'Up to 7 days',[m
[31m-  study: 'Up to 6 months',[m
[31m-  vawc: 'Up to 10 days',[m
[31m-  rehabilitation: 'Up to 6 months',[m
[31m-  special_emergency: 'Up to 5 days',[m
[31m-  calamity: 'Up to 5 days',[m
[31m-  adoption: 'Per DSWD approval',[m
[31m-  terminal: 'Upon separation',[m
[31m-  other: 'Varies',[m
[31m-};[m
[31m-[m
 /**[m
  * Formats a Date object as a local-time yyyy-mm-dd string.[m
  * NOTE: Deliberately avoids `.toISOString()`, which converts to UTC first —[m
[36m@@ -264,12 +265,6 @@[m [mexport default function ApplyLeavePage() {[m
     toast.success('File removed');[m
   };[m
 [m
[31m-  // Jump to the leave type from the sidebar, and scroll the form back to the[m
[31m-  // Type of Leave card so the user sees the description/details update.[m
[31m-  const handleSidebarSelect = (type: LeaveType) => {[m
[31m-    setLeaveType(type);[m
[31m-  };[m
[31m-[m
   const handleSubmit = async (e: React.FormEvent) => {[m
     e.preventDefault();[m
 [m
[36m@@ -397,61 +392,9 @@[m [mexport default function ApplyLeavePage() {[m
       />[m
 [m
       <form onSubmit={handleSubmit}>[m
[31m-        <div className="grid gap-6 lg:grid-cols-[240px_1fr_340px]">[m
[31m-          {/* Leave Types Sidebar — desktop only, sticky while scrolling.[m
[31m-              Mirrors the CSC Omnibus Rules categories, with each type's[m
[31m-              allowed duration shown underneath. Clicking selects it, same[m
[31m-              as the Select dropdown used on mobile below. */}[m
[31m-          <div className="hidden lg:block">[m
[31m-            <Card className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">[m
[31m-              <CardHeader className="pb-3">[m
[31m-                <CardTitle className="text-base">Leave Types</CardTitle>[m
[31m-                <CardDescription className="text-xs">[m
[31m-                  Click a type to select it[m
[31m-                </CardDescription>[m
[31m-              </CardHeader>[m
[31m-              <CardContent className="space-y-4">[m
[31m-                {(Object.keys(leaveCategories) as (keyof typeof leaveCategories)[]).map((category) => ([m
[31m-                  <div key={category}>[m
[31m-                    <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1.5 tracking-wide">[m
[31m-                      {leaveCategoryLabels[category]}[m
[31m-                    </p>[m
[31m-                    <div className="space-y-1">[m
[31m-                      {leaveCategories[category].map((type) => {[m
[31m-                        const isActive = leaveType === type;[m
[31m-                        return ([m
[31m-                          <button[m
[31m-                            key={type}[m
[31m-                            type="button"[m
[31m-                            onClick={() => handleSidebarSelect(type)}[m
[31m-                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${[m
[31m-                              isActive[m
[31m-                                ? 'bg-primary text-primary-foreground'[m
[31m-                                : 'hover:bg-muted text-foreground'[m
[31m-                            }`}[m
[31m-                          >[m
[31m-                            <span className="block text-sm font-medium leading-tight">[m
[31m-                              {leaveTypeLabels[type]}[m
[31m-                            </span>[m
[31m-                            <span[m
[31m-                              className={`block text-[11px] mt-0.5 ${[m
[31m-                                isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'[m
[31m-                              }`}[m
[31m-                            >[m
[31m-                              {leaveTypeDurations[type] ?? '—'}[m
[31m-                            </span>[m
[31m-                          </button>[m
[31m-                        );[m
[31m-                      })}[m
[31m-                    </div>[m
[31m-                  </div>[m
[31m-                ))}[m
[31m-              </CardContent>[m
[31m-            </Card>[m
[31m-          </div>[m
[31m-[m
[32m+[m[32m        <div className="grid gap-6 lg:grid-cols-3">[m
           {/* Main Form */}[m
[31m-          <div className="space-y-6">[m
[32m+[m[32m          <div className="lg:col-span-2 space-y-6">[m
             {/* Leave Type Selection */}[m
             <Card>[m
               <CardHeader>[m
[36m@@ -460,15 +403,11 @@[m [mexport default function ApplyLeavePage() {[m
                   Type of Leave[m
                 </CardTitle>[m
                 <CardDescription>[m
[31m-                  {leaveType[m
[31m-                    ? 'Selected from the leave types list'[m
[31m-                    : 'Select the type of leave as prescribed by CSC Omnibus Rules'}[m
[32m+[m[32m                  Select the type of leave as prescribed by CSC Omnibus Rules[m
                 </CardDescription>[m
               </CardHeader>[m
               <CardContent className="space-y-4">[m
[31m-                {/* Dropdown selector — only needed on mobile/tablet where the[m
[31m-                    sidebar is hidden. Desktop users pick from the sidebar. */}[m
[31m-                <div className="space-y-2 lg:hidden">[m
[32m+[m[32m                <div className="space-y-2">[m
                 