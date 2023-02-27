import * as THREE from 'three';
import { generateUUID, handleColorChange } from './utills';
import { GLTFModelLoader } from './GLTFModelLoader.js';
import { HDRMapLoader } from './HDRMapLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
import { SharpnessDPass} from './postprocessing/SharpnessDPass';
import { BlurDPass} from './postprocessing/BlurDPass';
import { SepiaDPass} from './postprocessing/SepiaDPass';
import { SaturateDPass} from './postprocessing/SaturateDPass';
import { BrightnessDPass} from './postprocessing/BrightnessDPass';
import { ContrastDPass} from './postprocessing/ContrastDPass';
import { GrayscaleDPass} from './postprocessing/GrayscaleDPass';
import { HueRotateDPass} from './postprocessing/HueRotateDPass';
import { InvertDPass } from './postprocessing/InvertDPass';
import { OpacityDPass } from './postprocessing/OpacityDPass';
import { ColorCorrectionDPass } from './postprocessing/ColorCorrectionDPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { WorldSpaceUI } from './worldspaceui';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import { PSGFZipExporter, model_viewer_zip } from './PSGFZipExporter';
import {
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
  _temp
} from './constants/app';
import { three_constants } from './constants/three';

let gltfModelLoader;
let hdrMapLoader;
let gui;
let animSlider;
let camera, scene, renderer, clock;
let refractionTexture;
let maskTexture;
let backTexture;
let composer;
let controls;
let lastIntersectionPoint = new THREE.Vector3(0.1,0.1,0.1);
let lastIntersectedObject = -1;
let cursor;
let default_camera_pos;
let rightClickContextMenuContainer, annotationContextMenuContainer, annotationEditContainer;
let annotation_id_input, annotation_label_input, annotation_title_input, annotation_description_input;
let sharpnessPass,
  blurPass,
  sepiaPass,
  saturatePass,
  brightnessPass,
  contrastPass,
  grayscalePass,
  huerotatePass,
  invertPass,
  opacityPass,
  colorcorrectionPass;

class App {

  init() {
    const self = this;
    const container = document.createElement( 'div' );
    document.body.appendChild( container );
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 120 );
    camera.position.set( - 0.9, 0.3, 1.45 );

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.colorManagement = true;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild( renderer.domElement );

    hdrMapLoader = new HDRMapLoader(renderer);
    gltfModelLoader = new GLTFModelLoader(renderer);

    controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 0.05;
    controls.maxDistance = 9;
    controls.target.set( 0, 0, 0 );
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.7;
    controls.enableZoom = false; // disable OrbitContrls zoom
    controls.minZoom = .05;
    controls.maxZoom = 8.9;
    controls.update();

    default_camera_pos = {
      x0: camera.position.x,
      y0: camera.position.y,
      z0: camera.position.z,
      x1: controls.target.x,
      y1: controls.target.y,
      z1: controls.target.z,
      update: function () {
        this.x0 = camera.position.x;
        this.y0 = camera.position.y;
        this.z0 = camera.position.z;
        this.x1 = controls.target.x;
        this.y1 = controls.target.y;
        this.z1 = controls.target.z;
      }
    };

    const w2 = window.innerWidth + window.innerWidth;
    const h2 = window.innerWidth + window.innerWidth;
    const renderPass = new RenderPass( scene, camera );
    composer = new EffectComposer( renderer );
    composer.setSize( w2, h2);
    composer.addPass( renderPass );

    refractionTexture = new THREE.CanvasTexture(renderer.domElement);
    maskTexture = new THREE.WebGLRenderTarget( w2, h2, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat
    } );
    backTexture = new THREE.WebGLRenderTarget( w2, h2, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat
    } );

    //PostProcessing
    opacityPass = new OpacityDPass(maskTexture.texture);
    composer.addPass( opacityPass );
    sharpnessPass = new SharpnessDPass(maskTexture.texture);
    composer.addPass( sharpnessPass );
    blurPass = new BlurDPass(maskTexture.texture);
    composer.addPass( blurPass );
    sepiaPass = new SepiaDPass(maskTexture.texture);
    composer.addPass( sepiaPass );
    saturatePass = new SaturateDPass(maskTexture.texture);
    composer.addPass( saturatePass );
    brightnessPass = new BrightnessDPass(maskTexture.texture);
    composer.addPass( brightnessPass );
    contrastPass = new ContrastDPass(maskTexture.texture);
    composer.addPass( contrastPass );
    grayscalePass = new GrayscaleDPass(maskTexture.texture);
    composer.addPass( grayscalePass );
    huerotatePass = new HueRotateDPass(maskTexture.texture);
    composer.addPass( huerotatePass );
    invertPass = new InvertDPass(maskTexture.texture);
    composer.addPass( invertPass );
    colorcorrectionPass = new ColorCorrectionDPass(maskTexture.texture);
    composer.addPass( colorcorrectionPass );
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    composer.addPass( gammaCorrectionPass );
    gammaCorrectionPass.renderToScreen = true;

    opacityPass.uniforms.tBack.value = backTexture.texture;

    renderer.domElement.addEventListener('wheel', (w) => { self.customZoomEvent(w); });
    renderer.domElement.addEventListener('touchstart', e => { self.hideAnnotations(); controls.enableZoom=true, { passive: true}});
    renderer.domElement.addEventListener('touchend', e => controls.enableZoom=false, { passive: true});
    window.addEventListener('resize', self.onWindowResize );

    // self.createSlider();

    if (typeof project == 'undefined') self.initEditor();
    else self.initViewer();
  }

  initEditor(){
    const self = this;
    hdrMapLoader.loadHDRFromMapsList(hdrMapLoader.default_hdr, (texture) => {
      scene.background = texture;
      scene.environment = texture;
    })

    self.initContextMenu();
    self.createCameraResetButton();
    renderer.domElement.addEventListener('contextmenu', self.contextmenu.bind(this), false);
    renderer.domElement.addEventListener('click', self.raycast.bind(this), false);
    progressLoader.show();

    gltfModelLoader.loadModel(gltfModelLoader.default_model, function ( gltf ) {
      const roughnessMipmapper = new RoughnessMipmapper( renderer );
      self.configureGltfAnimation(gltf);
      scene.add( gltf.scene );
      self.initGUI();
      progressLoader.hide();
      roughnessMipmapper.dispose();
    } );
  }

  initViewer(){
    renderer.domElement.addEventListener('click', self.hideAnnotations);
    self.importFromText(project, ()=>{});
  }

  customZoomEvent(w){
    const sens = .2;
    const mul = (w.wheelDelta > 0) ? 1-sens : 1+sens;
    const dir = camera.position.clone().sub(controls.target);
    const dist = dir.length();
    const final_dist = dist * mul;
    if (dist > controls.minZoom && dist < controls.maxZoom) {
      dir.normalize();
      const t = new TWEEN.Tween({value: dist})
        .to({value: final_dist}, 600)
        .interpolation(TWEEN.Interpolation.Bezier)
        .easing(TWEEN.Easing.Quintic.Out);
      t.onUpdate(function() {
        if (this._object.value <= controls.minZoom) this._object.value = controls.minZoom + .1;
        if (this._object.value >= controls.maxZoom) this._object.value = controls.maxZoom - .1;
        const pos = controls.target.clone();
        const dir = camera.position.clone().sub(pos).normalize();
        pos.add(dir.multiplyScalar(this._object.value));
        camera.position.copy(pos);
      });
      t.onComplete(function() {
        if (this._object.value <= controls.minZoom) this._object.value = controls.minZoom + .1;
        if (this._object.value >= controls.maxZoom) this._object.value = controls.maxZoom - .1;
        const pos = controls.target.clone();
        const dir = camera.position.clone().sub(pos).normalize();
        pos.add(dir.multiplyScalar(this._object.value));
        camera.position.copy(pos);
      });
      t.start();
    }
  }

  configureGltfAnimation(gltf) {
	if (!animSlider && gltf.animations.length) this.createSlider();
    const mixer = new THREE.AnimationMixer( gltf.scene );
    let max = 0
	animList.splice(0);
    for(let i = 0; i < gltf.animations.length; i++) {
      const clip = gltf.animations[i];
      animList.push(mixer.clipAction(clip));
      max = Math.max(max, clip.duration);
    }
	if (animSlider) animSlider.max = max;
	if (animList[0]) animList[0].play();
	mixers.push(mixer);
  }

  createCameraResetButton() {
    const bt_cam = document.createElement('button');
    const bt_cam_div = document.createElement('div');
    bt_cam_div.className = 'bt_cam_div';
    bt_cam.className='button-5';
    bt_cam.role='button';
    bt_cam.onclick = () => default_camera_pos.update();
    bt_cam.innerText = 'Set Camera';
    document.body.appendChild(bt_cam_div);
    bt_cam_div.appendChild(bt_cam);
  }

  createSlider () {
    const panel = document.createElement('div');
    panel.className = 'slider_panel';
    animSlider = document.createElement('input');
    animSlider.type = 'range';
    animSlider.step = 'any';
    animSlider.current = 0;
    animSlider.oninput = function () {
      if (mixers[this.current].timeScale == 0) {
        mixers[this.current].timeScale = 1;
        mixers[this.current].setTime(this.value);
        mixers[this.current].timeScale = 0;
      } else {
        mixers[this.current].setTime(this.value);
      }
    };
    const btn = document.createElement('button');
    btn.innerText = '⏸';
    btn.className = 'slider_btn';
    btn.onclick = function () {
      if ( mixers[animSlider.current].timeScale == 0) {
        mixers[animSlider.current].timeScale = 1;
        this.innerText = '⏸';
      } else {
        mixers[animSlider.current].timeScale = 0;
        this.innerText = '▶';
      }
    };
    animSlider.label = document.createElement('p');
    animSlider.label.innerText = '00:00';
    animSlider.label.className = 'slider_label';
    panel.appendChild(animSlider);
    panel.appendChild(animSlider.label);
    panel.appendChild(btn);
    document.body.appendChild(panel);
  }

  placeAnnotation (mesh, position, a) {
    const pos = new THREE.Vector3().fromBufferAttribute( position, a );
    if ( mesh.material.morphTargets && geometry.morphAttributes.position && mesh.morphTargetInfluences ) {
      for ( let i = 0, il = geometry.morphAttributes.position.length; i < il; i ++ ) {
        const influence = mesh.morphTargetInfluences[ i ];
        if ( influence !== 0 ) {
		  const morphAttribute = geometry.morphAttributes.position[ i ];
          _temp.fromBufferAttribute( morphAttribute, a );
          if ( geometry.morphTargetsRelative ) {
            _morph.addScaledVector( _temp, influence );
          } else {
            _morph.addScaledVector( _temp.sub( pos ), influence );
          }
	    }
      }
      pos.add( _morph );
    }
    if ( mesh.isSkinnedMesh && mesh.material.skinning ) {
      mesh.boneTransform( a, pos );
    }
    return pos;
  }

  update () {
    const self = this;
    const delta = clock.getDelta();
    progressLoader.update(delta);
    Object.values(annotations).forEach((value) => {
      if (gltfModelLoader.toIntersect[value.anchor] && value.anchor_vertex) {
        const v = value.anchor_vertex,
          mesh = gltfModelLoader.toIntersect[value.anchor],
          geometry = mesh.geometry,
          index = geometry.index,
          position = geometry.getAttribute('position');
        let pos;
        if (index == null) {
          const a = position.array[v];
          pos = self.placeAnnotation(mesh, position, a);
        } else {
          const a = index.getX( v );
          pos = self.placeAnnotation(mesh, position, a);
        }
        pos.applyMatrix4( mesh.matrixWorld );
        value.world_ui.pos.copy(pos);
        value.sphere.pos.copy(pos);
      }
      value.world_ui.update(camera, window.innerWidth, window.innerHeight);
      value.sphere.update(camera, window.innerWidth, window.innerHeight);
    });
    for ( let i = 0; i < mixers.length; i ++ ) {
      mixers[ i ].update( delta );
      if (animSlider && animSlider.current == i) {
        let v = mixers[i].time % animSlider.max;
        animSlider.value = v;
        v = Math.floor(v);
        let s = v % 60;
        let m = (v - s) / 60;
        m = `${m < 10 ? '0' : ''}${m}`;
        s = `${s < 10 ? '0' : ''}${s}`;
        animSlider.label.innerText = `${m}:${s}`;
      }
    }
    controls.dampingFactor = Math.min(0.99, 12 * delta);
    controls.update();
    TWEEN.update();

    if (opacityPass.enabled) {
      scene.children[0].visible = false;
      renderer.setRenderTarget(backTexture);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      scene.children[0].visible = true;
    }
    let upd = () => {};
    composer.passes.forEach(p => {
      if (p.uniforms) {
        if (p.uniforms.tMask && p.enabled) upd = self.updateMask;
        if (p.uniforms.maskOpacity) {
          p.uniforms.maskOpacity.value = opacityPass.uniforms.fIntensity.value;
        }
      }
    } );

    // Refractions
    let refr = false; // hide shader materials to avoid recursion
    scene.traverse(obj => {
      if (obj.material && obj.material.refract) {
        refr = true;
        obj.visible = false;
        obj.material.userData.color.value.setRGB(obj.material.color.r,obj.material.color.g,obj.material.color.b);
        obj.material.userData.roughness.value = obj.material.internalRoughness;
        obj.material.userData.IOR.value = obj.material.refractionRatio;
        obj.material.userData.opacity.value = obj.material.transparent? obj.material.opacity : 1;
      }
    });
    if (refr) {
      upd();
      composer.render();
      refractionTexture.needsUpdate = true;
      scene.traverse(obj => {
        if (obj.visible === false && obj.material && obj.material.refract)
          obj.visible = true;
      });
    }
    // get texture without background for alpha mask
    upd();
    composer.render();
  }

  updateMask () {
    const BG = scene.background
    scene.background = null;
    renderer.setRenderTarget(maskTexture);
    renderer.render( scene, camera );
    renderer.setRenderTarget(null);
    scene.background = BG;
  }

  //Reset/hide context menu
  contextmenu ( event ) {
    this.resetContextMenu();
    this.hideAnnotations();

    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    const intersects = raycaster.intersectObjects( gltfModelLoader.toIntersect );
    if ( intersects.length > 0 ) {
      cursor = new THREE.Mesh(
        new THREE.SphereGeometry(.01, 7, 7),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: .4
        })
      );
      lastIntersectedObject = gltfModelLoader.toIntersect.indexOf(intersects[0].object);
      lastIntersectionPoint = intersects[0].point;
      cursor.position.copy(lastIntersectionPoint);
      scene.add(cursor);

      //Show context menu
      rightClickContextMenuContainer.style.visibility = 'visible';
      rightClickContextMenuContainer.style.top = event.clientY ;
      rightClickContextMenuContainer.style.left = event.clientX + 20;
      annotationEditContainer.style.top = event.clientY ;
      annotationEditContainer.style.left = event.clientX + 20;
    }
  }

  raycast( event ) {
    this.resetContextMenu();
    this.hideAnnotations();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    const intersects = raycaster.intersectObjects( gltfModelLoader.toIntersect );
    if ( intersects.length > 0 ) {
      this.addMaterialGUI(intersects[0].object);
      lastIntersectedObject = gltfModelLoader.toIntersect.indexOf(intersects[0].object);
    }
  }

  initContextMenu(){
    //Menus
    rightClickContextMenuContainer = document.getElementById('right_click_contextmenu');
    annotationContextMenuContainer = document.getElementById('annotation_contextmenu');
    annotationEditContainer = document.getElementById('annotation_edit');

    //Inputs
    annotation_id_input = document.getElementById('annotation_id');
    annotation_label_input = document.getElementById('annotation_label');
    annotation_title_input = document.getElementById('annotation_title');
    annotation_description_input = document.getElementById('annotation_description');

    if (typeof project == 'undefined') {
      //Context menu buttons
      document.getElementById('create_annotation').addEventListener('click', this.createAnnotationButton.bind(this), false);
      document.getElementById('edit_annotation').addEventListener('click', this.editAnnotationButton.bind(this), false);
      document.getElementById('remove_annotation').addEventListener('click', this.removeAnnotationButton.bind(this), false);

      //Edit annotation window
      document.getElementById('save_annotation').addEventListener('click', this.saveAnnotationButton.bind(this), false);
      document.getElementById('cancel_annotation').addEventListener('click', this.cancelEditAnnotationButton.bind(this), false);
    }
  }

  createAnnotationButton( event ) {
    event.preventDefault();
    this.resetContextMenu();
    this.editAnnotation(generateUUID());
  }

  editAnnotationButton( event ) {
    event.preventDefault();
    this.resetContextMenu();
    this.hideAnnotations();
    const targetElement = event.target || event.srcElement;
    const annotation_id = annotations[targetElement.getAttribute('annotation_id')].id;
    this.editAnnotation(annotation_id);
  }

  removeAnnotationButton( event ) {
    event.preventDefault();
    this.resetContextMenu();
    this.hideAnnotations();
    const targetElement = event.target || event.srcElement;
    const annotation_id = annotations[targetElement.getAttribute('annotation_id')].id;
    annotations[targetElement.getAttribute('annotation_id')].sphere.element.remove();
    delete annotations[annotation_id];
  }

  saveAnnotationButton( event ) {
    // event.preventDefault();
    let ui, sphere;
    if (annotations[annotation_id_input.value] == null) {
      ui = new WorldSpaceUI(lastIntersectionPoint);
      sphere = new WorldSpaceUI(lastIntersectionPoint, 'button');
      ui.class = 'UIElement';
      sphere.class = 'UISphere';
      sphere.setAttribute('annotation_id', annotation_id_input.value);
      sphere.element.addEventListener('click', this.sphereClick.bind(this), false);
      sphere.element.addEventListener('contextmenu', this.sphereRightClick.bind(this), false);
      sphere.offset = new THREE.Vector2(-24, -28);
      sphere.visible = true;
    } else {
      ui = annotations[annotation_id_input.value].world_ui;
      sphere = annotations[annotation_id_input.value].sphere;
      lastIntersectionPoint = annotations[annotation_id_input.value].intersection_point;
    }

    ui.header = annotation_title_input.value;
    ui.description = annotation_description_input.value;
    sphere.name = annotation_label_input.value;

    let v = null;
    if (lastIntersectedObject >= 0) {
      let minDistance = Infinity;
      const target = new THREE.Vector3(),
        triangle = new THREE.Triangle(),
        mesh = gltfModelLoader.toIntersect[lastIntersectedObject],
        geometry = mesh.geometry,
        index = geometry.index,
        position = geometry.attributes.position,
        _morphA = new THREE.Vector3(),
        _morphB = new THREE.Vector3(),
        _morphC = new THREE.Vector3(),
        _tempA = new THREE.Vector3(),
        _tempB = new THREE.Vector3(),
        _tempC = new THREE.Vector3();
      const morphing = (a, b, c, i) => {
        triangle.a.fromBufferAttribute( position, a );
        triangle.b.fromBufferAttribute( position, b );
        triangle.c.fromBufferAttribute( position, c );
        if ( mesh.material.morphTargets && geometry.morphAttributes.position && mesh.morphTargetInfluences ) {
          _morphA.set( 0, 0, 0 );
          _morphB.set( 0, 0, 0 );
          _morphC.set( 0, 0, 0 );
          for ( let i = 0, il = geometry.morphAttributes.position.length; i < il; i ++ ) {
            const influence = mesh.morphTargetInfluences[ i ];
            const morphAttribute = geometry.morphAttributes.position[ i ];
            if ( influence === 0 ) continue;
            _tempA.fromBufferAttribute( morphAttribute, a );
            _tempB.fromBufferAttribute( morphAttribute, b );
            _tempC.fromBufferAttribute( morphAttribute, c );
            if ( geometry.morphTargetsRelative ) {
              _morphA.addScaledVector( _tempA, influence );
              _morphB.addScaledVector( _tempB, influence );
              _morphC.addScaledVector( _tempC, influence );
            } else {
              _morphA.addScaledVector( _tempA.sub( triangle.a ), influence );
              _morphB.addScaledVector( _tempB.sub( triangle.b ), influence );
              _morphC.addScaledVector( _tempC.sub( triangle.c ), influence );
            }
          }
          triangle.a.add( _morphA );
          triangle.b.add( _morphB );
          triangle.c.add( _morphC );
        }
        if ( mesh.isSkinnedMesh && mesh.material.skinning ) {
          mesh.boneTransform( a, triangle.a );
          mesh.boneTransform( b, triangle.b );
          mesh.boneTransform( c, triangle.c );
        }
        triangle.a.applyMatrix4( mesh.matrixWorld );
        triangle.b.applyMatrix4( mesh.matrixWorld );
        triangle.c.applyMatrix4( mesh.matrixWorld );
        triangle.closestPointToPoint( lastIntersectionPoint, target );
        var distanceSq = lastIntersectionPoint.distanceToSquared( target );
        if ( distanceSq < minDistance ) {
          minDistance = distanceSq;
          v = i;
        }
      };
      if (index == null) {
        index = position.array;
        for ( let i = 0; i < index.length; i += 3 ) {
          morphing(index[i], index[i + 1], index[i + 2], i);
        }
      } else {
        for ( let i = 0, l = index.count; i < l; i += 3 ) {
          morphing(index.getX( i ), index.getX( i + 1 ), index.getX( i + 2 ), i);
        }
      }
    }
    var annotation = {
      'id': annotation_id_input.value,
      'label': annotation_label_input.value,
      'title': annotation_title_input.value,
      'description': annotation_description_input.value,
      'intersection_point': lastIntersectionPoint.clone(),
      'sphere' : sphere,
      'world_ui' : ui,
      'camera_pos': camera.position.clone(),
      'anchor': lastIntersectedObject,
      'anchor_vertex': v
    };
    annotations[annotation_id_input.value] = annotation;
    this.resetContextMenu();
  }

  cancelEditAnnotationButton( event ) {
    event.preventDefault();
    annotation_id_input.value = '';
    annotation_label_input.value = '';
    annotation_title_input = '';
    annotation_description_input = '';
    this.resetContextMenu();
  }

  sphereClick( event ) {
    event.preventDefault();
    this.resetContextMenu();
    this.hideAnnotations();
    const targetElement = event.target || event.srcElement;
    const tweenCameraPos = annotations[targetElement.getAttribute('annotation_id')].camera_pos;
    annotations[targetElement.getAttribute('annotation_id')].world_ui.visible = true;
    const goTween = new TWEEN.Tween(camera.position)
      .to({
        x: tweenCameraPos.x,
        y: tweenCameraPos.y,
        z: tweenCameraPos.z
      }, 1500)
      .interpolation(TWEEN.Interpolation.Bezier)
      .easing(TWEEN.Easing.Quintic.Out);
    goTween.start();
  }

  sphereRightClick( event ){
    event.preventDefault();
    this.resetContextMenu();
    this.hideAnnotations();
    var targetElement = event.target || event.srcElement;
    var annotation_id = annotations[targetElement.getAttribute('annotation_id')].id;

    document.getElementById('edit_annotation').setAttribute('annotation_id', annotation_id);
    document.getElementById('remove_annotation').setAttribute('annotation_id', annotation_id);

    //Show sphere context menu
    annotationContextMenuContainer.style.visibility = 'visible';
    annotationContextMenuContainer.style.top = event.clientY ;
    annotationContextMenuContainer.style.left = event.clientX + 20;
    annotationEditContainer.style.top = event.clientY ;
    annotationEditContainer.style.left = event.clientX + 20;
  }

  resetContextMenu(){
    if (typeof project == 'undefined') {
      rightClickContextMenuContainer.style.visibility = 'hidden';
      annotationContextMenuContainer.style.visibility = 'hidden';
      annotationEditContainer.style.visibility = 'hidden';
      scene.remove(cursor);
    }
  }

  hideAnnotations(){
    if (Object.keys(annotations).length > 0) {
      Object.keys(annotations).forEach(function(key) {
        annotations[key].world_ui.visible = false;
      });
    }
  }

  editAnnotation(annotation_id){
    annotation_id_input.value = annotation_id;
    annotation_label_input.value = annotations[annotation_id] ? annotations[annotation_id].label : '';
    annotation_title_input.value = annotations[annotation_id] ? annotations[annotation_id].title : '';
    annotation_description_input.value = annotations[annotation_id] ? annotations[annotation_id].description : '';
    annotationEditContainer.style.visibility = 'visible';
  }

  initGUI(){
    if (gui) gui.destroy ();
    gui = new GUI({
      width : 400
    });
    this.sceneConfigGUI();
    if (animList[1]) this.animationListGUI();
    this.postProcessingGUI();
  }

  sceneConfigGUI() {
    const data = {
      HDRMap: hdrMapLoader.hdrMapKeys[ 0 ],
      SelectedMesh:  gltfModelLoader.sceneMeshKeys[0],
    };
    const app = this;
    const folder = gui.addFolder( 'Scene Configs' );
    folder.add( {'Load GLTF': function () { app.loadGLTFFromFile()} }, 'Load GLTF' );
    folder.add( data, 'HDRMap', hdrMapLoader.hdrMapKeys ).name('HDR Map').onChange( this.updateHDR());
    folder.add( {'Load hdr': function () { app.loadHDRFromFile()} }, 'Load hdr' );
    folder.add( data, 'SelectedMesh', gltfModelLoader.sceneMeshKeys ).name('Select Mesh').onChange( this.SelectSceneMesh(gltfModelLoader.sceneObjectMeshes));

    folder.add( {'Load scene': function () { app.importScene()} }, 'Load scene' );
    folder.add( {'Save scene': function () { app.exportScene()} }, 'Save scene' );
    folder.add( {expo: function () { app.exportProject()} }, 'expo' ).name('Export standalone project');

    folder.open();
  }

  animationListGUI() {
    const folder = gui.addFolder( 'Animations' );
    for(let i = 0; i < animList.length; i ++) {
      const cname = animList[i]._clip.name || 'Animation' + (i+1).toString();
      folder.add( {change: function () {
        animList.forEach(clip => clip.stop());
        animList[i].play();
      } }, 'change' ).name(cname);
    }
    folder.open();
  }

  postProcessingGUI(){
    const Background_folder = gui.addFolder( 'Background filters' ); //Background
    //brightness
    Background_folder.add( brightnessPass.config, 'bTrigger').name('Brightness').onChange( () => { brightnessPass.update();} );
    Background_folder.add( brightnessPass.config, 'bIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { brightnessPass.update();} );
    //sharpness
    Background_folder.add( sharpnessPass.config, 'bTrigger').name('Sharpness').onChange( () => { sharpnessPass.update();} );
    Background_folder.add( sharpnessPass.config, 'bIntensity').name('>').min(0).max(3).step(0.01).onChange( () => { sharpnessPass.update();} );
    //blur
    Background_folder.add( blurPass.config, 'bTrigger').name('Blur').onChange( () => { blurPass.update();} );
    Background_folder.add( blurPass.config, 'bIntensity').name('>').min(0).max(3).step(0.01).onChange( () => { blurPass.update();} );
    //sepia
    Background_folder.add( sepiaPass.config, 'bTrigger').name('Sepia').onChange( () => { sepiaPass.update();} );
    Background_folder.add( sepiaPass.config, 'bIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { sepiaPass.update();} );
    //saturate
    Background_folder.add( saturatePass.config, 'bTrigger').name('Saturation').onChange( () => { saturatePass.update();} );
    Background_folder.add( saturatePass.config, 'bIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { saturatePass.update();} );
    //invert
    Background_folder.add( invertPass.config, 'bTrigger').name('Inverted').onChange( () => { invertPass.update();} );
    Background_folder.add( invertPass.config, 'bIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { invertPass.update();} );
    //hue rotate
    Background_folder.add( huerotatePass.config, 'bTrigger').name('Hue-rotate').onChange( () => { huerotatePass.update();} );
    Background_folder.add( huerotatePass.config, 'bIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { huerotatePass.update();} );
    //grayscale
    Background_folder.add( grayscalePass.config, 'bTrigger').name('Grayscale').onChange( () => { grayscalePass.update();} );
    Background_folder.add( grayscalePass.config, 'bIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { grayscalePass.update();} );
    //contrast
    Background_folder.add( contrastPass.config, 'bTrigger').name('Contrast').onChange( () => { contrastPass.update();} );
    Background_folder.add( contrastPass.config, 'bIntensity').name('>').min(-0.5).max(0.5).step(0.01).onChange( () => { contrastPass.update();} );
    //color correction
    Background_folder.add( colorcorrectionPass.config, 'bTrigger').name('Color').onChange( () => { colorcorrectionPass.update();} );
    Background_folder.add( colorcorrectionPass.config, 'bIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { colorcorrectionPass.update();});
    Background_folder.addColor( colorcorrectionPass.config, 'bColor').name('>').onChange( () => { colorcorrectionPass.update();});
    //opacity
    Background_folder.add( opacityPass.config, 'bTrigger').name('Opacity').onChange( () => { opacityPass.update();} );
    Background_folder.add( opacityPass.config, 'bIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { opacityPass.update();}  );

    const Model_folder = gui.addFolder( 'Model filters' ); //Model
    //brightness
    Model_folder.add( brightnessPass.config, 'fTrigger').name('Brightness').onChange(  () => { brightnessPass.update();} );
    Model_folder.add( brightnessPass.config, 'fIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { brightnessPass.update();} );
    //sharpness
    Model_folder.add( sharpnessPass.config, 'fTrigger').name('Sharpness').onChange( () => { sharpnessPass.update();} );
    Model_folder.add( sharpnessPass.config, 'fIntensity').name('>').min(0).max(3).step(0.01).onChange( () => { sharpnessPass.update();} );
    // //blur
    Model_folder.add( blurPass.config, 'fTrigger').name('Blur').onChange( () => { blurPass.update();} );
    Model_folder.add( blurPass.config, 'fIntensity').name('>').min(0).max(3).step(0.01).onChange( () => { blurPass.update();} );
    //sepia
    Model_folder.add( sepiaPass.config, 'fTrigger').name('Sepia').onChange( () => { sepiaPass.update();}  );
    Model_folder.add( sepiaPass.config, 'fIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { sepiaPass.update();}  );
    //saturate
    Model_folder.add( saturatePass.config, 'fTrigger').name('Saturation').onChange( () => { saturatePass.update();} );
    Model_folder.add( saturatePass.config, 'fIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { saturatePass.update();} );
    //invert
    Model_folder.add( invertPass.config, 'fTrigger').name('Inverted').onChange( () => { invertPass.update();}  );
    Model_folder.add( invertPass.config, 'fIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { invertPass.update();}  );
    //hue rotate
    Model_folder.add( huerotatePass.config, 'fTrigger').name('Hue-rotate').onChange( () => { huerotatePass.update();} );
    Model_folder.add( huerotatePass.config, 'fIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { huerotatePass.update();} );
    //grayscale
    Model_folder.add( grayscalePass.config, 'fTrigger').name('Grayscale').onChange( () => { grayscalePass.update();} );
    Model_folder.add( grayscalePass.config, 'fIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { grayscalePass.update();} );
    //contrast
    Model_folder.add( contrastPass.config, 'fTrigger').name('Contrast').onChange( () => { contrastPass.update();} );
    Model_folder.add( contrastPass.config, 'fIntensity').name('>').min(-0.5).max(0.5).step(0.01).onChange( () => { contrastPass.update();} );
    //color correction
    Model_folder.add( colorcorrectionPass.config, 'fTrigger').name('Color').onChange( () => { colorcorrectionPass.update();} );
    Model_folder.add( colorcorrectionPass.config, 'fIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { colorcorrectionPass.update();} );
    Model_folder.addColor( colorcorrectionPass.config, 'fColor').name('>').onChange( () => { colorcorrectionPass.update();} );
    //opacity
    Model_folder.add( opacityPass.config, 'fTrigger').name('Opacity').onChange( () => { opacityPass.update();} );
    Model_folder.add( opacityPass.config, 'fIntensity').name('>').min(0).max(1).step(0.01).onChange( () => { opacityPass.update();} );
  }

  //Add GUI configuration for Selected Object
  addMaterialGUI(selectedObject) {
    this.initGUI();
    if (selectedObject != null) {
      const params = {
        Object: selectedObject.name
      };
      gui.add(params, 'Object').onFinishChange(function (value) {
        console.log(value);
      });
      this.guiMaterial(selectedObject.material, selectedObject.geometry);
      this.guiMeshStandardMaterial(selectedObject.material, selectedObject.geometry);
      gui.open();
    }
  }

  guiMaterial(  material, geometry ) {
    const folder = gui.addFolder( 'THREE.Material' );
    folder.add( material, 'transparent' );
    folder.add( material, 'opacity', 0, 1 ).step( 0.01 );
    folder.add( material, 'depthTest' );
    folder.add( material, 'depthWrite' );
    folder.add( material, 'alphaTest', 0, 1).step( 0.01 ).onChange( this.needsUpdate( material, geometry ) );
    folder.add( material, 'visible' );
    folder.add( material, 'side', three_constants.side ).onChange( this.needsUpdate( material, geometry ) );
    folder.open();
  }

  guiMeshStandardMaterial( material, geometry ) {
    geometry.computeVertexNormals();
    if (material.internalRoughness == undefined) material.internalRoughness = 0;

    const data = {
      color: material.color.getHex(),
      emissive: material.emissive.getHex(),
      map: diffuseMapKeys[ 0 ],
      aoMap: aoMapKeys[ 0 ],
      alphaMap: alphaMapKeys[ 0 ],
      bumpMap: bumpMapKeys[ 0 ],
      normalMap: normalMapKeys[ 0 ],
      metalnessMap: metMapKeys[ 0 ],
      roughnessMap: roughMapKeys[ 0 ]
    };

    const app = this;
    const folder = gui.addFolder( 'THREE.MeshStandardMaterial' );
    folder.addColor( data, 'color' ).onChange( handleColorChange( material.color ) );
    folder.addColor( data, 'emissive' ).onChange( handleColorChange( material.emissive ) );
    folder.add( material, 'refractionRatio', 0, 1).step(.01);
    folder.add( material, 'internalRoughness', 0, 1).step(.01);
    folder.add( material, 'roughness', 0, 1).step(.01);
    folder.add( material, 'metalness', 0, 1).step(.01);
    folder.add(material, 'aoMapIntensity', 0, 1).step(.01);
    folder.add(material, 'bumpScale', 0, 1).step(.01);
    folder.add( material, 'wireframe');
    folder.add( material, 'fog' );
    //refraction
    if (material.refract == null) material.refract = false;
    folder.add( material, 'refract' ).name('Refraction').onChange(v => app.toggleRefractiveMaterial(material, v));
    // Texture Maps
    const tex = folder.addFolder('Textures');
    //texture map
    tex.add( data, 'map', diffuseMapKeys ).name('texture').onChange( this.updateTexture( material, 'map', diffuseMaps ) );
    tex.add( {load: function () { app.loadTextureFromFile( material, 'map', diffuseMaps, diffuseMapKeys ) }}, 'load' ).name('Load texture');
    //ao map
    tex.add( data, 'aoMap', aoMapKeys ).name('ao map').onChange( this.updateTexture( material, 'aoMap', aoMaps ) );
    tex.add( {load: function () { app.loadTextureFromFile( material, 'aoMap', aoMaps, aoMapKeys ) }}, 'load' ).name('Load AO map');
    //bump map
    tex.add( data, 'bumpMap', bumpMapKeys ).name('bump map').onChange( this.updateTexture( material, 'bumpMap', bumpMaps ) );
    tex.add( {load: function () { app.loadTextureFromFile( material, 'bumpMap', bumpMaps, bumpMapKeys ) }}, 'load' ).name('Load bump map');
    //alpha map
    tex.add( data, 'alphaMap', alphaMapKeys ).name('alpha map').onChange( this.updateTexture( material, 'alphaMap', alphaMaps ) );
    tex.add( {load: function () { app.loadTextureFromFile( material, 'alphaMap', alphaMaps, alphaMapKeys ) }}, 'load' ).name('Load alpha map');
    //normal map
    tex.add( data, 'normalMap', normalMapKeys ).name('normal map').onChange( this.updateTexture( material, 'normalMap', normalMaps ) );
    tex.add( {load: function () { app.loadTextureFromFile( material, 'normalMap', normalMaps, normalMapKeys ) }}, 'load' ).name('Load normal map');
    //metalness map
    tex.add( data, 'metalnessMap', metMapKeys ).name('metalness map').onChange( this.updateTexture( material, 'metalnessMap', metalnessMaps ) );
    tex.add( {load: function () { app.loadTextureFromFile( material, 'metalnessMap', metalnessMaps, metMapKeys ) }}, 'load' ).name('Load metalness map');
    //roughness map
    tex.add( data, 'roughnessMap', roughMapKeys ).name('roughness map').onChange( this.updateTexture( material, 'roughnessMap', roughnessMaps ) );
    tex.add( {load: function () { app.loadTextureFromFile( material, 'roughnessMap', roughnessMaps, roughMapKeys ) }}, 'load' ).name('Load roughness map');
    folder.open();
  }

  updateTexture( material, materialKey, textures ) {
    return function ( key ) {
      material[ materialKey ] = textures[ key ];
      material.needsUpdate = true;
    };
  }

  updateHDR() {
    return function (key){
      hdrMapLoader.loadHDRFromMapsList(key, (texture) => {
        scene.background = texture;
        scene.environment = texture;
      })
    };
  }

  // load gltf from file
  loadGLTFFromFile() {
    const self = this;
    let fileLoader = document.createElement('input');
    fileLoader.type = 'file';
    fileLoader.onResult = function (data) {
      self.removeChildren(scene);
      gltfModelLoader.loadModel(data, function ( gltf ) {
          const roughnessMipmapper = new RoughnessMipmapper( renderer );
          self.configureGltfAnimation(gltf);
          const bbox = new THREE.Box3().setFromObject(gltf.scene);
          const s = 1.0 / Math.max(Math.max(bbox.max.x-bbox.min.x, bbox.max.y-bbox.min.y),bbox.max.z-bbox.min.z);
          if (s < 1) gltf.scene.scale.set(s,s,s);
          scene.add( gltf.scene );
          self.initGUI();
          roughnessMipmapper.dispose();
      } );
      fileLoader.remove();
    }
    fileLoader.reader = new FileReader();
    fileLoader.reader.onload = function () { fileLoader.onResult(this.result) }
    fileLoader.onchange = function () {
      if (this.files.length < 1) return;
      if (this.files[0]) {
        this.reader.readAsDataURL(this.files[0]);
      }
    }
    fileLoader.click();
  }

  loadTextureFromFile( material, materialKey, textures, list ) {
    const app = this;
    // load image from file
    TextureFileLoader.onResult = function (data) {
      let files = 0;
      list.forEach(n => {
        if (n.substring(0,5) === 'file_')
          files ++;
      });
      let key = 'file_' + files.toString();
      textures[key] = new THREE.TextureLoader().load(data);
      textures[key].name = key;
      material[ materialKey ] = textures[key];
      material.needsUpdate = true;
      list.push(key);
      if (lastIntersectedObject >= 0)
        app.addMaterialGUI(gltfModelLoader.toIntersect[lastIntersectedObject]);
    }
    TextureFileLoader.click();
  }

  loadHDRFromFile() {
    const self = this;
    TextureFileLoader.onResult = function (data) {
      hdrMapLoader.loadHDRFromByteArray(data, (texture) => {
        scene.background = texture;
        scene.environment = texture;
        self.initGUI();
      });
    }
    TextureFileLoader.click();
  }

  SelectSceneMesh(array){
    var self = this;
    return function (key){
      self.addMaterialGUI(array[key]);
    };
  }

  needsUpdate( material, geometry ) {
    return function () {
      material.vertexColors = material.vertexColors;
      material.side = parseInt( material.side );
      material.needsUpdate = true;
      if (geometry.attributes.position)
        geometry.attributes.position.needsUpdate = true;
      if (geometry.attributes.normal)
        geometry.attributes.normal.needsUpdate = true;
      if (geometry.attributes.color)
        geometry.attributes.color.needsUpdate = true;
    };
  }

  onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer?.setSize( window.innerWidth, window.innerHeight );
    let w2 = window.innerWidth, h2 = window.innerHeight;
    backTexture.setSize( w2, h2 );
    maskTexture.setSize( w2, h2 );
  }

  toggleRefractiveMaterial (material, b) {

    if (Object.keys(material.userData).length < 4) {
      material.userData.IOR = {value: material.refractionRatio};
      material.userData.roughness = {value: material.internalRoughness};
      material.userData.opacity = {value: material.opacity};
      material.userData.color = {value: material.color};
      material.userData.back = {value: refractionTexture};
    }

    if (b) material.onBeforeCompile = function (shader) {

      shader.uniforms.IOR = material.userData.IOR;
      shader.uniforms.rough = material.userData.roughness;
      shader.uniforms.opaque = material.userData.opacity;
      shader.uniforms.color = material.userData.color;
      shader.uniforms.back = material.userData.back;

      shader.vertexShader = [
        'varying vec2 vBackUv, vRefrUv;',
        'uniform float IOR;',
        shader.vertexShader.substring(0, shader.vertexShader.length - 1),
        'vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * objectNormal );',
        'vec3 I = worldPosition.xyz - cameraPosition;',
        'vec3 refr = refract( normalize( I ), worldNormal, IOR );',
        'vec4 pos = projectionMatrix * viewMatrix * vec4(refr * length(I) + cameraPosition, 1.0);',
        'vRefrUv = .5 + .5 * pos.xy / pos.w;',
        'pos = projectionMatrix * viewMatrix * worldPosition;',
        'vBackUv = .5 + .5 * (pos.xy / pos.w); }',
      ].join('\n');
      shader.fragmentShader = [
        'varying vec2 vBackUv, vRefrUv;',
        'uniform sampler2D back;',
        'uniform float rough, opaque;',
        'uniform vec3 color;',
        'vec3 blur_2 (vec3 col, float value, sampler2D layer, vec2 uv) {',
        'float Directions = 16.0; // BLUR DIRECTIONS',
        'float Quality = 8.0; // BLUR QUALITY',
        'float Size = 90. * value; // BLUR SIZE (Radius)',
        'vec2 Radius = Size/vec2(800.0);',
        'vec3 Color = col;',
        'for( float d=0.0; d<6.2832; d+=0.3927) {',
        'for(float i=0.125; i<=1.0; i+=0.125) {',
        'Color += texture2D( layer, uv+vec2(cos(d),sin(d))*Radius*i).rgb; } }',
        'Color /= Quality * Directions - 15.0;',
        'return  Color; }',
        shader.fragmentShader.substring(0, shader.fragmentShader.length - 1),
        'vec3 col = texture2D(back, vRefrUv).rgb;',
        'if (rough > 0.0) col = blur_2 (col, rough, back, vRefrUv);',
        'col *= color;',
        'col = mix(col, gl_FragColor.rgb, opaque);',
        'gl_FragColor = vec4(col, 1); }',
      ].join('\n');
    }
    else material.onBeforeCompile = function () {}
    material.needsUpdate = true;
  }

  exportScene() {
    PSGFZipExporter.ExportToFile({
        annotations,
        postprocess: {
          sharpnessPass: sharpnessPass.config,
          blurPass: blurPass.config,
          sepiaPass: sepiaPass.config,
          saturatePass: saturatePass.config,
          brightnessPass: brightnessPass.config,
          contrastPass: contrastPass.config,
          grayscalePass: grayscalePass.config,
          huerotatePass: huerotatePass.config,
          invertPass: invertPass.config,
          opacityPass: opacityPass.config,
          colorcorrectionPass: colorcorrectionPass.config,
        },
        hdr: hdrMapLoader.getSelectedMap(),
        objects: gltfModelLoader.toIntersect,
        scale: scene.children[0].scale,
        model: gltfModelLoader.lastModelURL
      },
      function (data) {
        PSGFZipExporter.saveAsFile('scene.psgf', data);
      }
    );
  }

  importScene () {
    const self = this;
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = ()=>{
      if (input.files.length == 0) return;
      const file = input.files[0];
      const reader = new FileReader();
      const object = this;
      reader.onload = (e) => {
        const txt = e.target.result;
        if (JSON.parse(txt)) {
        // clear scene
          Object.keys(annotations).forEach(annotation_id => {
            annotations[annotation_id].sphere.element.remove();
            delete annotations[annotation_id];
          });
          mixers.splice(0);
          object.removeChildren(scene);
        // import from file
          object.importFromText(txt, () => { self.initGUI(); });
        }
      }
      reader.readAsText(file);
      input.remove();
    };
    input.click();
  }

  removeChildren (obj) {
    while(obj.children.length > 0){
      this.removeChildren(obj.children[0]);
      obj.remove(obj.children[0]);
    }
    if(obj.geometry) obj.geometry.dispose();
    if(obj.material){
      Object.keys(obj.material).forEach(prop => {
      if(!obj.material[prop])
        return;
      if(obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')
        obj.material[prop].dispose();
      })
      obj.material.dispose();
    }
    if (obj === scene) {
      gltfModelLoader.remove();
    }
  }

  importFromText (txt, callback) {
    const obj = JSON.parse(txt);
    if (!obj) return;
    const app = this;
    // load gltf model
    gltfModelLoader.loadModel(obj.gltf, function ( gltf ) {
      const roughnessMipmapper = new RoughnessMipmapper( renderer );
      app.configureGltfAnimation(gltf);
      if (obj.scale) gltf.scene.scale.copy(obj.scale);
      scene.add( gltf.scene );
      roughnessMipmapper.dispose();
      // materials
      if (obj.meshes && obj.materials) {
        scene.traverse(node => {
          const mesh = obj.meshes.find(m => m.name === node.name);
          if (mesh != null) {
            const mat = obj.materials[mesh.material];
            Object.keys(mat).forEach(prop => {
              if (!(prop.includes('map') || prop.includes('Map') || prop.includes('color') || prop.includes('emissive')))
                node.material[prop] = mat[prop];
            });
            node.material.color.setRGB(mat.color.x,mat.color.y,mat.color.z);
            node.material.emissive.setRGB(mat.emissive.x,mat.emissive.y,mat.emissive.z);
            //refraction
            if (mat.refract) app.toggleRefractiveMaterial(node.material, true);
            // textures
            if (obj.textures.length) {
              let add_tex = function (id, prop, list, keys) {
                if (id < 0) return;
                let tex = obj.textures[id];
                if (tex.name) {
                  if (tex.src) {
                    if (list[tex.name] != null) list[tex.name].dispose();
                    list[tex.name] = new THREE.TextureLoader().load(tex.src);
                    keys.push(tex.name);
                  }
                  node.material[prop] = list[tex.name];
                  Object.keys(tex).forEach(key => node.material[prop][key] = tex[key]);
                }
              }
              add_tex(mat.map, 'map', diffuseMaps, diffuseMapKeys);
              add_tex(mat.aoMap, 'aoMap', aoMaps, aoMapKeys);
              add_tex(mat.bumpMap, 'bumpMap', bumpMaps, bumpMapKeys);
              add_tex(mat.alphaMap, 'alphaMap', alphaMaps, alphaMapKeys);
              add_tex(mat.normalMap, 'normalMap', normalMaps, normalMapKeys);
              add_tex(mat.metalnessMap, 'metalnessMap', metalnessMaps, metMapKeys);
              add_tex(mat.roughnessMap, 'roughnessMap', roughnessMaps, roughMapKeys);
            }
          }
        });
        diffuseMapKeys.sort();
        aoMapKeys.sort();
        alphaMapKeys.sort();
        bumpMapKeys.sort();
        normalMapKeys.sort();
        metMapKeys.sort();
        roughMapKeys.sort();
      }
      // annotations
      if (obj.annotations) {
        for(let i = 0; i < obj.annotations.length; i ++) {
          const a = obj.annotations[i];
          var ui, sphere, point = new THREE.Vector3(
                  a.intersection_point.x,
                  a.intersection_point.y,
                  a.intersection_point.z );

          ui = new WorldSpaceUI(point);
          ui.class = 'UIElement';
          ui.header = a.title;
          ui.description = a.description;
          sphere = new WorldSpaceUI(point, 'button');
          sphere.class = 'UISphere';
          sphere.setAttribute('annotation_id', a.id);
          sphere.element.addEventListener('click', app.sphereClick.bind(app), false);
          sphere.element.addEventListener('contextmenu', app.sphereRightClick.bind(app), false);
          sphere.offset = new THREE.Vector2(-24, -28);
          sphere.visible = true;
          sphere.name = a.label;

          annotations[a.id] = {
            'id': a.id,
            'label': a.label,
            'title': a.title,
            'description': a.description,
            'intersection_point': point,
            'sphere' : sphere,
            'world_ui' : ui,
            'camera_pos': new THREE.Vector3(
              a.camera_pos.x,
              a.camera_pos.y,
              a.camera_pos.z ),
            'anchor': a.anchor,
            'anchor_vertex': a.anchor_vertex
          }
        }
      }
      callback();
    } );
    // postprocessing
    if (obj.postprocess) {
      sharpnessPass.config = obj.postprocess.sharpnessPass;
      sharpnessPass.update();
      blurPass.config = obj.postprocess.blurPass;
      blurPass.update();
      sepiaPass.config = obj.postprocess.sepiaPass;
      sepiaPass.update();
      saturatePass.config = obj.postprocess.saturatePass;
      saturatePass.update();
      brightnessPass.config = obj.postprocess.brightnessPass;
      brightnessPass.update();
      contrastPass.config = obj.postprocess.contrastPass;
      contrastPass.update();
      grayscalePass.config = obj.postprocess.grayscalePass;
      grayscalePass.update();
      huerotatePass.config = obj.postprocess.huerotatePass;
      huerotatePass.update();
      invertPass.config = obj.postprocess.invertPass;
      invertPass.update();
      opacityPass.config = obj.postprocess.opacityPass;
      opacityPass.update();
      colorcorrectionPass.config = obj.postprocess.colorcorrectionPass;
      colorcorrectionPass.update();
    }
    // hdr
    if (obj.hdr) {
      if (obj.hdr.data) {
        hdrMapLoader.loadHDRFromByteArray(obj.hdr.data, (texture) => {
          scene.background = texture;
          scene.environment = texture;
        });
      } else {
        hdrMapLoader.loadHDRFromMapsList(obj.hdr.name, (texture) => {
          scene.background = texture;
          scene.environment = texture;
        });
      }
    }
    // set camera position
    camera.position.set(obj.camera_position.x,obj.camera_position.y,obj.camera_position.z);
    controls.target.set(obj.camera_target.x,obj.camera_target.y,obj.camera_target.z);
    camera.lookAt(controls.target);
    camera.updateWorldMatrix();
  }

  exportProject() {
    const write_to_zip = function (txt, str) {
      const { x0, y0, z0, x1, y1, z1 } = default_camera_pos;
      str = str[0] +
        `camera_position: {x: ${x0}, y: ${y0}, z: ${z0}}; camera_target: {x: ${x1}, y: ${y1}, z: ${z1}}, ` +
        str.substring(1);

      const ZipFiles = [
        { zip_file: 'viewer/js/project.js', content: 'const project = `' + str +'`'},
        { zip_file: 'viewer/js/bundle.js', url: model_viewer_zip.js_bundle,},
        { zip_file: 'viewer/css/3dUI.css', url: model_viewer_zip.css_3dui},
        { zip_file: 'viewer/css/main.css', url: model_viewer_zip.css_main},
        { zip_file: 'viewer/index.html', url: model_viewer_zip.html_index},
        { zip_file: 'viewer/basis/basis_transcoder.js', url: model_viewer_zip.js_basis_transcoder},
        { zip_file: 'viewer/basis/basis_transcoder.wasm', url: model_viewer_zip.wasm_basis_transcoder},
      ]
      if (!hdrMapLoader.getSelectedMap().data) {
        ZipFiles.push({zip_file: 'viewer/' + hdrMapLoader.default_path + hdrMapLoader.getSelectedMap().file, url: hdrMapLoader.default_path + hdrMapLoader.getSelectedMap().file});
      }

      PSGFZipExporter.mergeZips(ZipFiles).then(function(zip) {
        zip.generateAsync({type: 'blob'})
          .then(function(data){
            PSGFZipExporter.saveAsZip('model_viewer.zip', data);
          })
      });
    }
    PSGFZipExporter.ExportToFile({
        annotations,
        postprocess: {
          sharpnessPass: sharpnessPass.config,
          blurPass: blurPass.config,
          sepiaPass: sepiaPass.config,
          saturatePass: saturatePass.config,
          brightnessPass: brightnessPass.config,
          contrastPass: contrastPass.config,
          grayscalePass: grayscalePass.config,
          huerotatePass: huerotatePass.config,
          invertPass: invertPass.config,
          opacityPass: opacityPass.config,
          colorcorrectionPass: colorcorrectionPass.config,
        },
        hdr: hdrMapLoader.getSelectedMap(),
        objects: gltfModelLoader.toIntersect,
        scale: scene.children[0].scale,
        model: gltfModelLoader.lastModelURL
      },
      write_to_zip
    );
  }
}

export default App;
