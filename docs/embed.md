# Embedding the calculator

Free on any site. No signup, no key, no tracking of your visitors, no ads inside the frame.

The widget keeps one attribution link back to usmortgagecalc.com. That link is the entire price, and
removing it is the one thing the licence does not permit.

## Plain HTML — the short way

```html
<div data-usmc-calculator></div>
<script src="https://www.usmortgagecalc.com/embed.js" async></script>
```

The loader is under 2KB, has no dependencies, and is safe to include more than once. Every element
with `data-usmc-calculator` becomes a calculator, and each frame sizes itself to its content.

### Presetting fields

```html
<div data-usmc-calculator data-state="Texas" data-price="450000" data-rate="6.5"></div>
```

| Attribute | Value |
| --- | --- |
| `data-state` | Full state name, e.g. `"New Jersey"`. Sets the property tax rate. |
| `data-price` | Home price in dollars, no separators. |
| `data-rate` | Annual interest rate as a percent, e.g. `6.5`. |

A regional site should not open on a blank state field.

### iframe, for platforms that strip scripts

```html
<iframe
  src="https://www.usmortgagecalc.com/embed/calculator"
  title="US Mortgage Calculator"
  width="100%"
  height="720"
  style="border:0"
  loading="lazy"
></iframe>
```

Allow around 1,100px if you would rather never show an inner scrollbar, or use the script version and
let it resize itself.

## Framework examples

| File | Framework |
| --- | --- |
| [`react.jsx`](../examples/embed/react.jsx) | React — listens for the height message directly |
| [`nextjs.tsx`](../examples/embed/nextjs.tsx) | Next.js App Router |
| [`vue.vue`](../examples/embed/vue.vue) | Vue 3, Composition API |
| [`angular.ts`](../examples/embed/angular.ts) | Angular standalone component |

All four do the same thing: render an iframe and resize it when the frame posts its height.

## Hosted platforms

### WordPress

**Block editor** — add a *Custom HTML* block and paste the two-line snippet.

**Classic editor, or a theme that strips `<script>`** — use the iframe version.

**Shortcode** — in `functions.php`:

```php
add_shortcode( 'mortgage_calculator', function ( $atts ) {
    $atts  = shortcode_atts( array( 'state' => '', 'price' => '' ), $atts );
    $query = http_build_query( array_filter( array(
        'state'      => $atts['state'],
        'price'      => $atts['price'],
        'utm_source' => 'embed',
    ) ) );

    return sprintf(
        '<iframe src="%s" title="US Mortgage Calculator" width="100%%" height="720" style="border:0" loading="lazy"></iframe>',
        esc_url( 'https://www.usmortgagecalc.com/embed/calculator?' . $query )
    );
} );
```

Then `[mortgage_calculator state="Florida"]` in any post.

### Squarespace

Business plan or above (Code Blocks require it). Edit a section → **Add Block** → **Code** → set the
type to HTML → paste the two-line snippet. Squarespace does not strip scripts in Code Blocks, so the
self-sizing version works.

### Wix

**Add** → **Embed Code** → **Embed HTML** → *Code* mode → paste the snippet. Wix renders custom code
inside its own sandboxed iframe, so the height message cannot reach it — set the Wix element's height
manually to about 1,100px, or use the iframe version with a fixed height.

### Webflow

Drag an **Embed** element onto the page and paste the snippet. Webflow renders embeds inline rather
than in a sandbox, so self-sizing works. Publishing is required before the widget renders — embeds do
not run inside the Designer canvas.

## Attribution and analytics

The attribution link carries `?utm_source=embed&utm_medium=widget`, which is how installations are
counted. Please leave the parameters on: they are the only signal of where the widget is being used,
and nothing else about your visitors is collected.

If you would rather build your own interface, the
[REST API](https://www.usmortgagecalc.com/developers/api) returns the same calculations as JSON, and
the [datasets](https://www.usmortgagecalc.com/datasets) are downloadable under CC BY 4.0.
