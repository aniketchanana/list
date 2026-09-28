# Expenses

A single-page expense list. Type an amount and an optional description, and the total updates above the form. Everything stays in this browser through `localStorage`. Nothing is sent to a server.

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8765
```

Then visit `http://localhost:8765`.

## Open it on your phone

The page is published with GitHub Pages from the `main` branch, root folder.

1. Open this repository on GitHub and go to **Settings**, then **Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/ (root)**, then save.

After GitHub finishes the first publish, open:

https://aniketchanana.github.io/list/
