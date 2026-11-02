# Family Roots

A child-centered family-history archive with separate paternal and maternal branches. The initial paternal archive was imported from the family site; the maternal line is awaiting verified historical records. Living people appear as family roles and have no dates, places or photographs in the published data.

Serve locally with `python3 -m http.server 8768`, then open `http://localhost:8768/`. Run `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v` for data, privacy and asset checks. The site is a static GitHub Pages-ready application using `tree.json` and `content.json`; restored photos retain their original editions.

The checked-in robots settings ask search engines not to index the archive. That is not access control: if deployed publicly, every file is publicly retrievable. Review the archive and living-person privacy before deployment.

The GitHub Actions workflow runs hourly, on demand, and on changes to main. It checks out the public `srmcno/family` repository, imports changed paternal stories, people, timeline entries and newly referenced assets, runs the archive tests, commits the result with the built-in repository token, and deploys the same verified artifact to GitHub Pages. Configure Pages to use GitHub Actions. Scheduling can be delayed by GitHub; the workflow fails rather than publishing if it detects a conflict, missing asset, living-status change or known living-person identifier. The maternal branch is independent. Existing media files are not replaced automatically; replacements require review. Deleted upstream people and stories also require reconciliation.

To preview or apply locally, use `node scripts/sync-paternal.mjs /path/to/family` and add `--apply` for the latter. The script reads only committed source revisions. The `.paternal-revision` file tracks the imported commit. `paternal-policy.json` contains hashes for additional protected text; `.paternal-redactions.local.json` is ignored and is not required by the workflow. Name-based checks cannot identify every living person or identify people in photos, so they are not a complete privacy guarantee. GitHub Pages remains public.
