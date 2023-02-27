import * as THREE from 'three';
import { rgbTextureLoader } from './loaders';
import { getObjectsKeys } from "./utills";

class HDRMapLoader {
  fileLoader = new THREE.FileLoader();
  default_path = 'textures/equirectangular/';
  default_hdr = "path";
  hdrMaps = {};
  hdrMapKeys = getObjectsKeys( this.hdrMaps );
  pmremGenerator
  hdrEquirect;
  hdrCubeRenderTarget;
  hdrMapSelected;

  constructor(renderer){
    this.pmremGenerator = new THREE.PMREMGenerator( renderer );
    this.pmremGenerator.compileEquirectangularShader();
    this.fillHdrMaps();
  }

  fillHdrMaps(){
    this.hdrMaps["path"] = {name: 'path', file: 'HDR_041_Path.hdr'};
    this.hdrMapKeys = getObjectsKeys( this.hdrMaps );
  }

  getSelectedMap(){
    return this.hdrMaps[this.hdrMapKeys[this.hdrMapSelected]];
  }

  loadHDRFromMapsList(key, callback){
    this.hdrMapSelected = this.hdrMapKeys.indexOf(key);
    this.loadHDR(this.hdrMaps[key].file, this.default_path, (texture) => callback(texture));
  }

  loadHDR(hdr, path, callback) {
    var self = this;
    self.hdrEquirect = rgbTextureLoader
      .setDataType( THREE.UnsignedByteType )
      .setPath( path)
      .load( hdr, (texture) => {
        if (self.hdrCubeRenderTarget != null) self.hdrCubeRenderTarget.dispose();
        self.hdrCubeRenderTarget  = self.pmremGenerator.fromEquirectangular(texture).texture;
        texture.dispose();
        self.hdrEquirect.dispose();
        self.pmremGenerator.dispose();
        callback(self.hdrCubeRenderTarget);
      } );
  }

  loadHDRFromByteArray(data, callback) {
    const self = this;
    const byteString = atob(data.substring(37));
    const mimeString = data.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const file = window.URL.createObjectURL(new Blob([ab], { type: mimeString }));
    let files = 0;
    self.hdrMapKeys.forEach((n) => {
      if (n.substring(0,4) === 'hdr_') files ++;
    });
    const key = 'hdr_' + files.toString();
    self.hdrMapKeys.push(key);
    self.hdrMaps[key] = { name: key, file: null};
    self.loadHDR(file, '', (texture) => {
      self.hdrMapSelected = self.hdrMapKeys.indexOf(key);
      self.getSelectedMap().data = data;
      callback(texture);
    });
  }
}

export { HDRMapLoader};