 var OpacityDShader = {

	uniforms: {
		'tDiffuse': { value: null },
		'tMask': { value: null },
		'tBack': { value: null },
		'bIntensity': { value: 0 },
		'fIntensity': { value: 0 },
		'cameraNear': { value: 0.01 },
		'cameraFar': { value: 120 },
	},

	vertexShader: [
		'varying vec2 vUv;',
		'void main() {',
		'	vUv = uv;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'

	].join( '\n' ),

	fragmentShader: [
		'#include <packing>',
		'uniform float bIntensity;',
		'uniform float fIntensity;',
		'uniform sampler2D tDiffuse;',
		'uniform sampler2D tMask;',
		'uniform sampler2D tBack;',
		'uniform float cameraNear;',
		'uniform float cameraFar;',
		'varying vec2 vUv;',

		'void main() {',
		'	float mask = texture2D( tMask, vUv ).a;',
		'	vec4 base = texture2D( tDiffuse, vUv );',
		'	vec4 back = texture2D( tBack, vUv );',
		'	float resultFG = mix(mask, .0, fIntensity);',
		'	float resultBG = mix(back.a, .0, bIntensity);',
		'	gl_FragColor.rgb = mix(back.rgb, base.rgb, resultFG);',
		'	gl_FragColor.a = max(resultBG, resultFG);',
		'}'

	].join( '\n' )

};

export { OpacityDShader };
