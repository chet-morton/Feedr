/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-init: line 174: cannot create temp file for here document: Operation not permitted
/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-init: line 199: cannot create temp file for here document: Operation not permitted
# PocketBase setup

The calculator works without PocketBase. To enable accounts and cloud-saved rations:

1. Deploy PocketBase on a persistent host with HTTPS and persistent storage. Do not host the PocketBase database on Vercel's ephemeral function filesystem.
2. In PocketBase Admin UI, create an **Auth** collection named `users` (or use your existing auth collection and update `public/static/app.js` to match its name). Allow public registration if you want the in-app account creation flow. Require verified email before enabling user data access in a public launch.
3. Create a **Base** collection named `rations` with these fields:

   | Field | Type | Required |
   | --- | --- | --- |
   | `owner` | Text | Yes |
   | `name` | Text | Yes |
   | `species` | Text | Yes |
   | `stage` | Text | No |
   | `head_count` | Number | Yes |
   | `body_weight` | Number | Yes |
   | `targets` | JSON | Yes |
   | `feeds` | JSON | Yes |
   | `analysis` | JSON | Yes |

4. Set all `rations` API rules explicitly. Use these expressions (PocketBase collection API rules are filters):

   - List: `@request.auth.id != "" && owner = @request.auth.id`
   - View: `@request.auth.id != "" && owner = @request.auth.id`
   - Create: `@request.auth.id != "" && @request.body.owner = @request.auth.id`
   - Update: `@request.auth.id != "" && owner = @request.auth.id && @request.body.owner = @request.auth.id`
   - Delete: `@request.auth.id != "" && owner = @request.auth.id`

5. Add `POCKETBASE_URL` as a Vercel environment variable, redeploy, then verify registration and that one account cannot read another account's records.

The page uses PocketBase's REST API directly for authentication and saving. It never embeds an admin token. User auth tokens live in browser local storage; sign out removes the local token. Add an account deletion/export path, email verification, recovery flow, backups, monitoring, and a published privacy policy before opening registration to the public. Configure PocketBase allowed origins to include the deployed app domain and any preview domains you intend to use.
