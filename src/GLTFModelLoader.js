import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module';
import { getObjectsKeys } from "./utills";

class GLTFModelLoader{
  default_model = 'models/gltf/DamagedHelmet/DamagedHelmet.gltf';
  gltfLoader = new GLTFLoader();

  toIntersect = [];
  sceneObjectMeshes = { '' : null };
  sceneMeshKeys = getObjectsKeys(this.sceneObjectMeshes);
  lastModelURL;
  ktx2Loader;
  dracoLoader;

  constructor(renderer){
    this.ktx2Loader = new KTX2Loader().setTranscoderPath( 'basis/' ).detectSupport( renderer );
    this.dracoLoader = new DRACOLoader().setDecoderPath( 'draco/gltf/' );
  }

  loadModel(model, callback){
    var self = this;
    self.lastModelURL = model;
    self.gltfLoader
      .setCrossOrigin('anonymous')
      .setPath( '' )
      .setDRACOLoader(self.dracoLoader)
      .setKTX2Loader(self.ktx2Loader)
      .setMeshoptDecoder( MeshoptDecoder )
      .load( model, function ( gltf ) {
        gltf.scene.traverse( function ( child ) {
          if ( child.isMesh ) {
            child.callback = function() { console.log( this.name ); }
            self.toIntersect.push(child);
            self.sceneObjectMeshes[child.name] = child;
          }
        });
        for(let i = self.toIntersect.length-1; i > 0; i --) {
          for(let j = 0; j < i; j ++) {
            if (self.toIntersect[j].material === self.toIntersect[i].material) {
              self.toIntersect[i].material = self.toIntersect[i].material.clone();
              break;
            }
          }
        }
        self.sceneMeshKeys = getObjectsKeys(self.sceneObjectMeshes);
        callback(gltf);
      } );
  }

  remove(){
    this.toIntersect.splice(0);
    this.sceneObjectMeshes = { '' : null };
    this.sceneMeshKeys.splice(0, this.sceneMeshKeys.length, '');
    this.sceneMeshKeys = getObjectsKeys(this.sceneObjectMeshes);
  }
}


export { GLTFModelLoader };