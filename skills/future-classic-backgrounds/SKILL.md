---
name: future-classic-backgrounds
description: Use when creating believable automotive photo backgrounds, preparing wide scenery for vertical car composites, or collecting background references from Future Classic car photographs.
---

# Future Classic Backgrounds

Create background-only images that look like ordinary, well-photographed places where a car could actually be parked. Support two modes: generate backgrounds, or collect photographic references. Follow the requested mode; collecting references does not itself request image generation.

## Defaults and scope

- Generate a wide 16:9 landscape plate, with enough coherent ground and surrounding scenery for a later 9:16 car composition. A request for final vertical output overrides this working ratio.
- If several options are requested without a count, make three distinct, individually usable images. Do not bundle them into a collage. Vary place, light or surface without defaulting to a fixed set of tourist destinations.
- Keep backgrounds free of cars, people, readable or unreadable lettering, road numbers, signs, advertisements, logos and watermarks. Plain road markings are acceptable if they contain no writing and suit the scene.
- Favor believable everyday locations: a quiet paved turnout, unmarked concrete wall, simple building frontage, understated industrial courtyard, or a modest coastal parking area. These are options, not a required shot list.
- Avoid spectacular scenery for its own sake, showroom stages, impossible architecture, excessive symmetry, glossy CGI surfaces, exaggerated sunset, HDR halos and theatrical fog. Keep ordinary wear, plausible construction and restrained color.
- Do not promise that an image is undetectably AI-generated. Describe generated imagery as generated scenery, never as verified real-location photography.

## Generate backgrounds

1. Inspect the supplied car photograph and available background references before drafting. Note camera height, horizon, view direction, lens impression, ground slope, light direction and softness. If no car photo is available, choose a natural car-height viewpoint and neutral soft daylight; do not block generation waiting for references.
2. When the owner names a Future Classic photo or saved reference, find and inspect that actual image in the accessible project or connected source. Use its ground, light, scale and atmosphere as reference, not its vehicle identity. If it cannot be found, say so and proceed with a clearly described generic background unless the task specifically requires that exact source.
3. Compose a plausible car-sized ground footprint in the lower-middle area, with real depth behind it. Keep useful landscape context beyond the eventual portrait frame. For a centered 9:16 crop of a 16:9 plate, only about 32% of the source width survives; accommodate car placement in that zone or plan a fresh portrait composition. Do not claim the full wide view fits unchanged.
4. Use the available image-generation tool for generation and edits. Attach inspected references using the tool's supported input mechanism. A text description of an unseen photograph is not a visual reference. If no generation tool is available, deliver the prompt and state that no image was generated.
5. Review the actual result against the checks below; correct visible defects before delivering. When only a background is requested, do not add a car or start video generation.

### Prompt example

Adapt scene and lighting to the actual inputs rather than repeating a fixed prompt:

> Wide 16:9 location photograph, an unmarked paved courtyard beside a simple weathered concrete building, photographed at car-window height with a natural moderate focal length. Soft overcast daylight, subtle surface wear, ordinary believable construction, restrained color and contrast. Continuous level pavement in the lower-middle area large enough to park one car, with depth behind it and usable context on both sides. Compose for a possible central 9:16 car portrait. Background only, no vehicles or people, no signs, lettering, numbers, advertisements, logos, watermarks or decorative typography.

### Visual review

- Inspect the full image, not just a thumbnail, including far-away objects for pseudo-lettering and signs.
- Confirm level usable ground, consistent scale and perspective, plausible architecture, restrained texture and natural lighting. A no-text prompt alone is not verification.
- Inspect the intended portrait crop or a separately composed portrait version: retain enough ground and space for the complete car, including wheels and bumpers. If no car was supplied, call this a placement assessment, not verified vehicle fit.
- For background replacement, match horizon, light, contact shadow and reflections to the actual car. Follow the owner's requested preservation level; do not silently regenerate its paint, wheels, badges or body details. Keep staged artwork distinct from restoration evidence photographs.
- Never claim a tool result was visually verified if it could not be inspected. State that limitation.

## Collect background references

Read [reference-catalog.md](references/reference-catalog.md) when collecting or retrieving references.

Prefer existing Future Classic photographs and user-provided images. Store the original car photograph as the reference; it does not have to be a car-free plate. Preserve its source and distinguish reference-only material from reusable background assets. Do not invent entries or claim an initial collection exists simply because this skill was created.

If a car is removed with image editing, the area hidden behind it is synthesized. Keep the original separately and label the edited plate accordingly. Never describe it as an extracted original photograph of the hidden scene.

Use external search only when requested or when local references do not address the task. Google image search is secondary discovery, not the required workflow: prioritize an accessible original image and its source page, and skip inaccessible originals. Inspect pixels before recommending a reference; do not classify a search thumbnail as proven camera photography or assume usage permission.

## Delivery

Deliver the requested images with short distinguishing labels; retain reference identity and provenance in the collection rather than adding text onto backgrounds. For generated images follow the image tool's display/save behavior. For reference collections use the environment's persistent project or file storage, preserve actual IDs/paths, and report how many real images were collected. This skill alone does not authorize publication, paid video jobs or bulk photo downloading.

## Reusable generated image files

When working in this project, read `assets/backgrounds/index.json` and the accompanying README to find the actual reusable PNG plates, prompts, dimensions and review status. Prefer owner-approved images when reusing a background; show candidate images for selection. An explicit request for new backgrounds still calls for generation. Keep original reference photographs separate from these generated plates. Store new reusable image bytes in that directory with a new versioned filename and update the index; never substitute local links for the image files themselves.
