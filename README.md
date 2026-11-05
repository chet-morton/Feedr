/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-init: line 174: cannot create temp file for here document: Operation not permitted
/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-init: line 199: cannot create temp file for here document: Operation not permitted
# Fieldfare

An original horse, sheep, and deer feed-ration planner built with Bootstrap 5, Alpine.js, Flask, Vercel Functions, and optional PocketBase persistence. It follows the general analyze-a-user-entered-ration workflow of a feed calculator: enter daily feed amounts and analyses, review nutrient coverage, scale to a group, and print/save a ration sheet.

## What it does

- Builds a daily ration with up to 24 feed ingredients per representative animal.
- Converts as-fed weights to dry matter and totals crude protein, digestible energy, calcium, and phosphorus from entered feed analyses.
- Compares the totals with editable per-animal targets and presents coverage bars.
- Scales per-animal feed amounts to the group size.
- Estimates daily feed cost from the optional per-pound ingredient price.
- Saves an in-progress draft in the current browser; optionally creates PocketBase accounts and saves ration records when configured.
- Prints a clean ration summary that can be saved as PDF from the browser.
- Provides horse and sheep starter targets, while leaving all targets editable. Deer targets are deliberately blank pending species-, season-, and life-stage-specific advice.

This is a **ration analyzer and planning aid**, not an optimizer, diagnostic tool, or complete NRC requirement engine. Ration values depend on the data supplied. It does not model trace minerals, vitamins, amino acid requirements, toxicity limits, feed interactions, individual intake, or species-specific deer requirements. Review feed changes with an appropriately qualified veterinarian or nutritionist. For sheep, check mineral products for copper suitability and follow veterinary/extension guidance.

## Run locally

Requires Python 3.10+.

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000`. PocketBase is optional; without `POCKETBASE_URL`, the calculator and browser draft work locally and cloud save stays unavailable. To enable cloud save locally, export `POCKETBASE_URL` in your shell before starting Flask. The Vercel dashboard supplies deployment environment variables.

## Deploy

1. Import this repository into Vercel. The root `app.py` exposes the Flask WSGI application; `public/` holds static assets.
2. Add `POCKETBASE_URL` in Vercel project environment variables and configure PocketBase using [pocketbase/SETUP.md](pocketbase/SETUP.md).
3. Deploy a preview and check the calculator, printed layout, account creation/sign-in, and per-user record access before promoting it.

Vercel's Flask/Python runtime is supported. PocketBase must be separately hosted with persistent storage and backups; Vercel function storage is not a database. See [Vercel's Flask deployment guide](https://vercel.com/docs/frameworks/backend/flask).

## Units and calculation convention

- As-fed amounts and body weights: pounds.
- Feed dry matter: percent of as-fed weight.
- Crude protein, calcium, phosphorus: percent of dry matter; output pounds per animal per day.
- Digestible energy: Mcal/kg of dry matter; output Mcal per animal per day (using 0.45359237 kg/lb).
- Zero target means “not compared”; it does not mean the nutrient is unnecessary.

The sheep starting point approximates the 154-lb mature ewe maintenance row in Oregon State University Extension's sheep requirements table (about 2.6 lb DM, 0.25 lb protein, 2.5 g calcium, and 2.4 g phosphorus). Stage and body weight affect requirements, so treat those as an editable starting reference only. The horse dry-matter starting point is 2% body weight as a broad planning estimate, not a complete requirements calculation. Deer have no generic starter target.

## Product boundary

This codebase provides an MVP product foundation. A real public launch also needs a configured PocketBase host, verified email and account recovery, owner-only access rules, privacy/terms and support contacts, monitoring and alerting, tested backup/restore, accessible device testing, security review, and a species-specific nutrition review. Throughput for 500 users is plausible for this lightweight architecture, but it has not been load-tested or production-certified.
