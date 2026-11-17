# SHIFTRIX Shopify tutorial section

`sections/shiftrix-how-to-configure.liquid` is a local, self-contained Online Store 2.0 section for the future `/pages/how-to-configure` template. It has not been uploaded to Shopify.

The section:

- renders English or French from `request.locale.iso_code`;
- provides a responsive video placeholder or merchant-configured embed URL;
- reads and validates `?id=CARD-00001`, `PLATE-00001`, or `STAND-00001` in the browser;
- builds `https://app.shiftrix.io/?id=CODE_ID` without dropping the identifier;
- allows manual entry in Shiftrix Track when the identifier is absent or invalid.

Before installation, the client must supply or approve the final tutorial video, exact Shopify theme/template target, final tutorial wording, accessibility transcript, and translated video/captions. Those additional email materials have not been received.
