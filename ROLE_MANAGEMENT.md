# Role Management Guide

Sharma Eye Hospital uses an automated **Row Level Security (RLS)** and **Trigger** system in Supabase to assign roles to users the very first time they log in. 

There are three available roles in the system:
- `admin`: Full access to inventory updates and all sales records.
- `store_manager`: Can view inventory and manage their own sales.
- `accountant`: Can view inventory and all sales records.

---

## How to Authorize a New Email Address

To grant a new employee access to the system, you need to update the database "rules" (the SQL trigger) **before** they log in for the first time.

### Step 1: Update the Codebase (Optional but Recommended)
For version control purposes, you should always update the local `supabase/schema.sql` file so your codebase accurately reflects the live database.

1. Open `supabase/schema.sql`.
2. Locate the `assign_user_role()` function (around line 90).
3. Add the new email address to the appropriate `IF` statement. 

For example, to add `new.employee@gmail.com` as a `store_manager`:
```sql
    -- Before
    ELSIF LOWER(TRIM(NEW.email)) IN ('manager1@example.com', 'manager2@example.com') THEN 
        assigned_role := 'store_manager'::public.user_role;
        
    -- After
    ELSIF LOWER(TRIM(NEW.email)) IN ('manager1@example.com', 'manager2@example.com', 'new.employee@example.com') THEN 
        assigned_role := 'store_manager'::public.user_role;
```

### Step 2: Update the Live Supabase Database (Required)
Updating the code doesn't change the live database automatically. You must run the updated SQL in Supabase.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/uijhvndsebxscoijfqdl).
2. Click on the **SQL Editor** in the left-hand sidebar.
3. Click **New query**.
4. Copy the entire `CREATE OR REPLACE FUNCTION public.assign_user_role()...` block from your updated `supabase/schema.sql` file.
5. Paste it into the SQL Editor and click **Run**.

### Step 3: Have the User Log In
Once the query successfully runs, tell the employee to go to the app and sign in (via Google or Email/Password). The system will recognize their email and automatically assign them the correct role.

---

## Troubleshooting

**What if the user already logged in before I added them to the SQL?**
If they logged in before they were added to the authorization list, they were likely rejected or given no permissions.
1. Go to the Supabase Dashboard -> **Authentication** -> **Users**.
2. Find their email and delete their user account.
3. Make sure you've completed Step 2 above.
4. Have them log in again.
