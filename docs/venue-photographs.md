# Venue photographs

The active venue images are the two JPEG files supplied by the organiser on 11 November 2026. They have been copied byte for byte into the repository, without generated scenery, filters, cropping or recompression. The layout preserves each photograph's original aspect ratio. Paper mounts and flowers are independent HTML/CSS layers.

- `public/assets/huerta-del-conde-supplied.jpg`: supplied as `jardin-fachada-y-fuente_1_203412-172846847620213.jpg`, 960 × 640. Casa Palacio Huerta del Conde, Cáceres.
- `public/assets/corral-ciguenas-supplied.jpg`: supplied as `21_20260805_132833.jpg`, 1000 × 750. El Corral de las Cigüeñas, Cáceres.

Previously used images were retrieved from each venue's website. They are no longer referenced by the venue component. Selection by the venue name prevents a photo being presented as an unrelated location when the settings change. Native lazy loading and explicit dimensions reserve space; a failed request offers a retry rather than displaying a broken image.
