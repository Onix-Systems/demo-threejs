class PSGFZipExporter {

  static mergeZips(sources) {
    const zip = new JSZip();
    return this.readSources(sources, zip).then(() => zip);
  }

  static readSources(arr, zip) {
    const self = this;
    return Promise.all(
      arr.map((obj) => {
        if (obj.url) return self.readSource(obj, zip);
        if (obj.content) return self.addContent(obj, zip);
      })
    );
  }

  static addContent(obj, zip) {
    return new Promise((resolve) => {
      resolve(zip.file(obj.zip_file, obj.content));
    });
  }

  static readSource(obj, zip) {
    return new Promise((resolve, reject) => {
      JSZipUtils.getBinaryContent(obj.url, function (err, data) {
        if (err) reject(err);
        resolve(zip.file(obj.zip_file, data));
      });
    });
  }

  static saveAsZip(filename, content) {
    const download = document.createElement('a');
    download.download = filename;
    download.onclick = () => download.remove();
    download.href = window.URL.createObjectURL(content);
    download.click();
  }

  static saveAsFile(filename, content) {
    var download = document.createElement('a');
    download.download = filename;
    download.onclick = () => download.remove();
    download.href = content;
    download.click();
  }

  static ExportToFile (arg1, callback) {
    if (arg1 == null) return null;
    let textFile = null;
    const out = {}, a = [], texturesList = [];
    const makeTextFile = function (text) {
      var data = new Blob([text], {type: 'text/plain'});
      if (textFile) window.URL.revokeObjectURL(textFile);
      textFile = window.URL.createObjectURL(data);
      return textFile;
    }
    Object.values(arg1.annotations).forEach((val) => {
      a.push(val);
    });
    const t = PSGFZipExporter.getAllTextures(arg1.objects);
    const m = PSGFZipExporter.getAllMaterials(arg1.objects);
    const obj = {
      annotations: a,
      postprocess: arg1.postprocess,
      hdr: arg1.hdr,
      textures: t,
      materials: m,
      meshes: arg1.objects,
      scale: arg1.scale,
      model: arg1.model
    }
    if (obj.textures != null) {
      for(let i = 0; i < obj.textures.maps.length; i ++)
        if (texturesList.indexOf(obj.textures.maps[i]) < 0)
          texturesList.push(obj.textures.maps[i]);
      for(let i = 0; i < obj.textures.bump.length; i ++)
        if (texturesList.indexOf(obj.textures.bump[i]) < 0)
          texturesList.push(obj.textures.bump[i]);
      for(let i = 0; i < obj.textures.normal.length; i ++)
        if (texturesList.indexOf(obj.textures.normal[i]) < 0)
          texturesList.push(obj.textures.normal[i]);
      for(let i = 0; i < obj.textures.metal.length; i ++)
        if (texturesList.indexOf(obj.textures.metal[i]) < 0)
          texturesList.push(obj.textures.metal[i]);
      for(let i = 0; i < obj.textures.rough.length; i ++)
        if (texturesList.indexOf(obj.textures.rough[i]) < 0)
          texturesList.push(obj.textures.rough[i]);
      for(let i = 0; i < obj.textures.env.length; i ++)
        if (texturesList.indexOf(obj.textures.env[i]) < 0)
          texturesList.push(obj.textures.env[i]);
    }
    if (obj.annotations != null) {
      out.annotations = obj.annotations;
    }
    if (obj.postprocess != null) {
      out.postprocess = obj.postprocess;
    }
    if (obj.hdr != null) {
      out.hdr = obj.hdr;
    }
    if (obj.materials != null) {
      out.materials = obj.materials.map((mat) => ({
        transparent: mat.transparent,
        opacity: mat.opacity,
        blending: mat.blending,
        blendSrc: mat.blendSrc,
        blendDst: mat.blendDst,
        blendEquation: mat.blendEquation,
        depthTest: mat.depthTest,
        depthWrite: mat.depthWrite,
        polygonOffset: mat.polygonOffset,
        polygonOffsetFactor: mat.polygonOffsetFactor,
        polygonOffsetUnits: mat.polygonOffsetUnits,
        alphaTest: mat.alphaTest,
        visible: mat.visible,
        side: mat.side,
        color: {
          x: mat.color.r,
          y: mat.color.g,
          z: mat.color.b
        },
        emissive: {
          x: mat.emissive.r,
          y: mat.emissive.g,
          z: mat.emissive.b
        },
        internalRoughness: mat.internalRoughness,
        roughness: mat.roughness,
        metalness: mat.metalness,
        refractionRatio: mat.refractionRatio,
        flatShading: mat.flatShading,
        wireframe: mat.wireframe,
        vertexColors: mat.vertexColors,
        fog: mat.fog,
        refract: mat.refract,
        aoMapIntensity: mat.aoMapIntensity,
        bumpScale: mat.bumpScale,
        map: texturesList.indexOf(mat.map),
        aoMap: texturesList.indexOf(mat.aoMap),
        bumpMap: texturesList.indexOf(mat.bumpMap),
        alphaMap: texturesList.indexOf(mat.alphaMap),
        normalMap: texturesList.indexOf(mat.normalMap),
        metalnessMap: texturesList.indexOf(mat.metalnessMap),
        roughnessMap: texturesList.indexOf(mat.roughnessMap)
      }));
    }
    if (obj.meshes != null) {
      out.meshes = obj.meshes.map((mesh) => ({
        name: mesh.name,
        material: obj.materials ? obj.materials.indexOf(mesh.material) : -1
      }));
    }
    if (obj.textures != null) {
      out.textures = texturesList
        .filter((tex) => obj.textures.env.indexOf(tex) < 0)
        .map((tex) => ({
          name: tex.name,
          wrapS: tex.wrapS,
          wrapT: tex.wrapT,
          repeat: tex.repeat,
          src: tex.image.currentSrc
        }));
    }
    if (obj.scale != null) {
      out.scale = { ...obj.scale }
    }
    if (obj.model != null) {
      const substr = obj.model.substring(obj.model.length - 4);
      if (substr == 'gltf' || substr == '.glb') {
        const request = new XMLHttpRequest();
        request.open('GET', obj.model, true);
        request.send(null);
        request.onreadystatechange = () => {
          if (request.readyState === 4 && request.status === 200) {
            out['gltf'] = 'data:text/plain;base64,' + btoa(request.responseText);
            const str = JSON.stringify(out,null,2);
            callback(makeTextFile(str),str);
          }
        };
      } else {
        out['gltf'] = obj.model;
        const str = JSON.stringify(out,null,2);
        callback(makeTextFile(str),str);
      }
    } else {
      const str = JSON.stringify(out,null,2);
      callback(makeTextFile(str),str);
    }
  }

  static getAllMaterials (obj) {
    const out = [];
    obj.forEach((o) => {
      if (o.material && out.indexOf(o.material) === 1) {
        out.push(o.material);
      }
    });
    return out;
  }

  static getAllTextures (obj) {
    const out = {
      normal: [],
      metal: [],
      rough: [],
      bump: [],
      maps: [],
      env: []
    };
    obj.forEach((o) => {
      const { material } = o;
      if (material) {
        if (material.map && out.maps.indexOf(material.map) === -1)
          out.maps.push(material.map);
        if (material.aoMap && out.maps.indexOf(material.aoMap) === -1)
          out.maps.push(material.aoMap);
        if (material.alphaMap && out.maps.indexOf(material.alphaMap) === -1)
          out.maps.push(material.alphaMap);
        if (material.bumpMap && out.bump.indexOf(material.bumpMap) === -1)
          out.bump.push(material.bumpMap);
        if (material.normalMap && out.normal.indexOf(material.normalMap) === -1)
          out.normal.push(material.normalMap);
        if (material.metalnessMap && out.metal.indexOf(material.metalnessMap) === -1)
          out.metal.push(material.metalnessMap);
        if (material.roughnessMap && out.rough.indexOf(material.roughnessMap) === -1)
          out.rough.push(material.roughnessMap);
      }
    });
    return out;
  }
}

const model_viewer_zip = {
  css_3dui: "css/3Dui.css",
  css_main: "css/main.css",
  html_index: 'index_viewer.html',
  js_bundle: "js/bundle.js",
  wasm_basis_transcoder: "basis/basis_transcoder.wasm",
  js_basis_transcoder: "basis/basis_transcoder.js"
}

export { PSGFZipExporter, model_viewer_zip };

