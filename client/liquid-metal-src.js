import { ShaderMount, liquidMetalFragmentShader, toProcessedLiquidMetal } from '@paper-design/shaders';

async function initLiquidMetal() {
  const navContainer = document.getElementById('nav-logo-shader');
  const heroContainer = document.getElementById('hero-logo-shader');
  if (!navContainer && !heroContainer) return;

  try {
    // Process SCQ.svg once through official Paper Design Poisson SDF heightmap solver
    const processed = await toProcessedLiquidMetal('SCQ.svg');
    const processedImage = new Image();
    processedImage.src = URL.createObjectURL(processed.pngBlob);
    await (processedImage.decode ? processedImage.decode() : new Promise(r => { processedImage.onload = r; }));

    const uniforms = {
      u_image: processedImage,
      u_imageAspectRatio: (processedImage.naturalWidth || 124) / (processedImage.naturalHeight || 124),
      u_isImage: true,
      u_colorBack: [0.0, 0.0, 0.0, 0.0],
      u_colorTint: [1.0, 1.0, 1.0, 1.0],
      u_softness: 0.5,
      u_repetition: 2.0,
      u_shiftRed: 0.4,
      u_shiftBlue: -0.4,
      u_distortion: 0.12,
      u_contour: 0.85,
      u_angle: 45.0,
      u_shape: 0.0,
      u_fit: 1.0,
      u_scale: 0.95,
      u_rotation: 0.0,
      u_offsetX: 0.0,
      u_offsetY: 0.0,
      u_originX: 0.5,
      u_originY: 0.5,
      u_worldWidth: 100.0,
      u_worldHeight: 100.0,
    };

    if (navContainer) {
      new ShaderMount(
        navContainer,
        liquidMetalFragmentShader,
        uniforms,
        { alpha: true, antialias: true, premultipliedAlpha: false },
        0.6,
        0,
        2,
        1500000
      );
      navContainer.classList.add('has-shader');
    }

    if (heroContainer) {
      new ShaderMount(
        heroContainer,
        liquidMetalFragmentShader,
        uniforms,
        { alpha: true, antialias: true, premultipliedAlpha: false },
        0.6,
        0,
        2,
        3000000
      );
      heroContainer.classList.add('has-shader');
    }
  } catch (err) {
    console.warn('Paper Shaders Liquid Metal init error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLiquidMetal);
} else {
  initLiquidMetal();
}
