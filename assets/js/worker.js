import * as jpeg from '@jsquash/jpeg';
import * as png from '@jsquash/png';
import optimise from '@jsquash/oxipng/optimise';

async function decode(sourceType, fileBuffer) {
  switch (sourceType) {
    //case 'avif':
    //  return await avif.decode(fileBuffer);
    case 'jpeg':
      return await jpeg.decode(fileBuffer);
    case 'png':
      return await png.decode(fileBuffer);
    //case 'webp':
    //  return await webp.decode(fileBuffer);
    default:
      throw new Error(`Unknown source type: ${sourceType}`);
  }
}

async function encode(outputType, imageData) {
  const options = {
    "jpeg_quality": 75,
    "jpeg_baseline": false,
    "jpeg_arithmetic": false,
    "jpeg_progressive": true,
    "jpeg_optimize_coding": true,
    "jpeg_smoothing": 0,
    "jpeg_color_space": 3,
    "jpeg_quant_table": 3,
    "jpeg_trellis_multipass": false,
    "jpeg_trellis_opt_zero": false,
    "jpeg_trellis_opt_table": false,
    "jpeg_trellis_loops": 1,
    "jpeg_auto_subsample": true,
    "jpeg_chroma_subsample": 2,
    "jpeg_separate_chroma_quality": false,
    "jpeg_chroma_quality": 75,
    "png_level": 2,
    "png_interlace": false,
    "auto_compress": true,
    "backup_original": true
};

  switch (outputType) {
    //case 'avif':
    //  return await avif.encode(imageData);
    case 'jpeg':
      const jpegOptions = {}
      for (const [key, value] of Object.entries(options)) {
        if (key.includes('jpeg')) {
          const keyName = key.replace('jpeg_', '')
          jpegOptions[keyName] = value
        }
      }
      return await jpeg.encode(imageData, jpegOptions);
    case 'png':
      const pngOptions = {}
      for (const [key, value] of Object.entries(options)) {
        if (key.includes('png')) {
          const keyName = key.replace('png_', '')
          pngOptions[keyName] = value
        }
      }
      return await png.encode(imageData, pngOptions);
    //case 'webp':
    //  return await webp.encode(imageData);
    default:
      throw new Error(`Unknown output type: ${outputType}`);
  }
}

async function convert(sourceType, outputType, fileBuffer) {
  const imageData = await decode(sourceType, fileBuffer);
  return encode(outputType, imageData);
}

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function showOutput(imageBuffer, outputType) {
  const imageBlob = new Blob([imageBuffer], { type: `image/${outputType}` });
  const base64String = await blobToBase64(imageBlob);

  return base64String;
}

self.onmessage = async function(e) {
  console.log('Worker: Message received from main script');

  const {fileBuffer, sourceType, outputType} = e.data;

  let imageBuffer = await convert(sourceType, outputType, fileBuffer);
  let base64 = await showOutput(imageBuffer, outputType);

  console.log(e)

  postMessage(base64)
  
}