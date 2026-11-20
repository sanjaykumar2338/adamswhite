# SHIFTRIX Shopify tutorial section

`sections/shiftrix-how-to-configure.liquid` is a local, self-contained Online Store 2.0 section for the future `/pages/how-to-configure` template. It has not been uploaded to Shopify.

The section:

- renders English or French from `request.locale.iso_code`;
- provides a responsive video placeholder or merchant-configured embed URL;
- reads and validates `?id=CARD-00001`, `PLATE-00001`, or `STAND-00001` in the browser;
- builds `https://app.shiftrix.io/?id=CODE_ID` without dropping the identifier or any other query parameters;
- allows manual entry in Shiftrix Track when the identifier is absent or invalid.

The original client tutorial video is available locally in the ignored client-assets directory as `How to configure your Popcard Products using Poptrack.mp4` (SHA-256 `85ac74986e36a51a2e2b33fe955384f5c6ebcfe67794af8ed2f323bc62c85281`). It has not been copied into Git, uploaded, transcoded, or published. Its visible Popcard/Poptrack terminology needs explicit client approval before it is used as the SHIFTRIX tutorial. After approval, upload the unchanged approved file to Shopify Files or an approved video host and configure its embed URL through the section setting.

The section intentionally inherits the active Shopify theme typography so it does not replace the storefront font system. Before installation, the client must also approve the exact theme/template target, tutorial wording, accessibility transcript, and French captions or equivalent French video.

The section is not required for active-product redirects: the Cloudflare Worker returns Laravel's Google Review `302` directly to the browser. It is used only for the unactivated tutorial journey. Do not publish this section until the client approves the target theme and page template.
