UTS UI JSON Schema Package
==========================

PURPOSE
-------
Share this package with the development team as the contract for UI element JSON.

REQUIRED OUTPUT FORMAT
----------------------
- Flat JSON array of objects (NO page_name, NO controls wrapper)
- Each object uses these fields:

{
  "Id": "",
  "Label": "{EMPTY}",
  "Name": "{EMPTY}",
  "ElementTagName": "SECTION",
  "X": "1282",
  "Y": "647",
  "Width": "230 (Screen Res:1536x864)",
  "Height": "24 (Screen Res:1536x864)",
  "Color": "{EMPTY}",
  "BackgroundColor": "{EMPTY}",
  "FontFamily": "{EMPTY}",
  "FontStyle": "{EMPTY}",
  "FontWeight": "{EMPTY}",
  "FontSize": "{EMPTY}",
  "LineHeight": "{EMPTY}",
  "LetterSpacing": "{EMPTY}",
  "TextAlign": "{EMPTY}",
  "LayoutMode": "{EMPTY}",
  "Gap": "{EMPTY}",
  "PaddingTop": "{EMPTY}",
  "PaddingRight": "{EMPTY}",
  "PaddingBottom": "{EMPTY}",
  "PaddingLeft": "{EMPTY}",
  "BorderWidth": "{EMPTY}",
  "BorderColor": "{EMPTY}",
  "BorderRadius": "{EMPTY}",
  "BoxShadow": "{EMPTY}"
}

PACKAGE CONTENTS
----------------
samples/
  screenshot-1.json ... screenshot-4.json  - Real screenshot-derived examples
  ALL-CONTROLS.json                        - Combined flat array
  sample-element.json                      - Minimal single-element example
  request-for-cheque-book-parameters.json   - Native FRAME-style example

docs/
  PROPERTY_IDENTIFICATION_MAPPING.txt/.json - Identified vs Not Identified properties
  UI_OBJECT_LIST.txt / EMAIL_PROPERTY_MAPPING.txt - Supporting docs

NOTES
-----
- Use "{EMPTY}" when a value is unknown.
- Color / Font / Padding / Border usually cannot be filled from screenshots alone.
- Width/Height may include screen resolution, e.g. "230 (Screen Res:1536x864)".
