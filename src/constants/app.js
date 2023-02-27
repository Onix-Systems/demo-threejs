import { Raycaster, Vector2, Vector3 } from 'three';
import { ProgressLoader } from "../ProgressLoader.js";
import { getObjectsKeys } from '../utills';

const raycaster = new Raycaster();
const mouse = new Vector2();
const annotations = [];
const progressLoader = new ProgressLoader();
const mixers = [];
const animList = [];

const TextureFileLoader = document.createElement('input');
TextureFileLoader.type = 'file';
TextureFileLoader.onResult = function () { console.log('oops! placeholder function call') };
TextureFileLoader.reader = new FileReader();
TextureFileLoader.reader.onload = function () { TextureFileLoader.onResult(this.result) }
TextureFileLoader.onchange = function () {
	if (this.files.length < 1) return;
	if (this.files[0]) {
		this.reader.readAsDataURL(this.files[0]);
	}
}

const diffuseMaps = { none: null }
const aoMaps = { none: null };
const bumpMaps = { none: null };
const normalMaps = { none: null };
const metalnessMaps = { none: null };
const alphaMaps = { none: null }
const roughnessMaps = { none: null }
const diffuseMapKeys = getObjectsKeys( diffuseMaps );
const aoMapKeys = getObjectsKeys( aoMaps );
const bumpMapKeys = getObjectsKeys( bumpMaps );
const normalMapKeys = getObjectsKeys( normalMaps );
const metMapKeys = getObjectsKeys( metalnessMaps );
const alphaMapKeys = getObjectsKeys( alphaMaps );
const roughMapKeys = getObjectsKeys( roughnessMaps );
const _morph = new Vector3();
const _temp = new Vector3();

export {
  raycaster,
  mouse,
  annotations,
  progressLoader,
  mixers,
  animList,
  TextureFileLoader,
  diffuseMaps,
  aoMaps,
  bumpMaps,
  normalMaps,
  metalnessMaps,
  alphaMaps,
  roughnessMaps,
  diffuseMapKeys,
  aoMapKeys,
  bumpMapKeys,
  normalMapKeys,
  metMapKeys,
  alphaMapKeys,
  roughMapKeys,
  _morph,
  _temp,
};
