import * as THREE from 'three';
import { LUTCubeLoader } from 'three/examples/jsm/loaders/LUTCubeLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
const rgbTextureLoader = new RGBELoader();
const lutCubeLoader = new LUTCubeLoader();

export { textureLoader, cubeTextureLoader, rgbTextureLoader, lutCubeLoader }