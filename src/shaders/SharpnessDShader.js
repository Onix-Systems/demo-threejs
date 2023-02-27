 var SharpnessDShader = {

	uniforms: {
		'tDiffuse': { value: null },
		'tMask': { value: null },
		'bIntensity': { value: 0 },
		'fIntensity': { value: 0 },
		'maskOpacity': { value: 0 },
		'cameraNear': { value: 0.01 },
		'cameraFar': { value: 120 },
        "width": { type: "f", value: 0.0 },
		"height": { type: "f", value: 0.0 },
		"kernel": { type: "fv1", value: [-1, -1, -1, -1, 9, -1, -1, -1, -1]}
	},

	vertexShader: [
		'varying vec2 vUv;',
		'void main() {',
		'	vUv = uv;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'

	].join( '\n' ),

	fragmentShader: [

		'#include <common>',
		'#include <packing>',
		'uniform float bIntensity;',
		'uniform float fIntensity;',
		'uniform float maskOpacity;',
        'uniform float width;',
		'uniform float height;',
		'uniform float kernel[9];',
		'uniform sampler2D tDiffuse;',
		'uniform sampler2D tMask;',
		'uniform float cameraNear;',
		'uniform float cameraFar;',
		'varying vec2 vUv;',

		'void main() {',
		'	float step_w = 1.0/width;',
		'	float step_h = 1.0/height;',
		'	vec2 offset[9];',
		'	offset[0] = vec2(-step_w, -step_h);',
		'	offset[1] = vec2(0.0, -step_h);',
		'	offset[2] = vec2(step_w, -step_h);',
		'	offset[3] = vec2(-step_w, 0.0);',
		'	offset[4] = vec2(0.0, 0.0);',
		'	offset[5] = vec2(step_w, 0.0);',
		'	offset[6] = vec2(-step_w, step_h);',
		'	offset[7] = vec2(0.0, step_h);',
		'	offset[8] = vec2(step_w, step_h);',
		'	vec3 sumFG = vec3(0.0), sumBG = vec3(0.0);',
		'	for( int i=0; i<9; i++ ) {',
		'		sumFG += texture2D(tMask, vUv + offset[i]).rgb * kernel[i];',
		'		sumBG += texture2D(tDiffuse, vUv + offset[i]).rgb * kernel[i]; }',
		'	float mask = texture2D( tMask, vUv ).a;',
		'	vec4 back = texture2D( tDiffuse, vUv );',
		'	mask *= 1.0 - maskOpacity;',
        '   vec3 effectFG = mix( back.rgb, sumFG, fIntensity );',
		'   vec3 effectBG = mix( back.rgb, sumBG, bIntensity );',
		'	vec3 resultFG = effectFG * mask;',
		'	vec3 resultBG = effectBG * (1.0 - mask);',
		'	gl_FragColor.rgb = resultFG + resultBG;',
		'	gl_FragColor.a = max(mask, back.a);',
		'}'

	].join( '\n' )

};

export { SharpnessDShader };
