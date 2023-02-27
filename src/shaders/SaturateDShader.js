 var SaturateDShader = {

	uniforms: {
		'tDiffuse': { value: null },
		'tMask': { value: null },
		'bIntensity': { value: 0 },
		'fIntensity': { value: 0 },
		'maskOpacity': { value: 0 },
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
		'uniform float maskOpacity;',
		'uniform sampler2D tDiffuse;',
		'uniform sampler2D tMask;',
		'uniform float cameraNear;',
		'uniform float cameraFar;',
		'varying vec2 vUv;',

		'void main() {',
		'	float mask = texture2D( tMask, vUv ).a;',
		'	vec4 back = texture2D( tDiffuse, vUv );',
		'	mask *= 1.0 - maskOpacity;',
		'	vec3 sumFG = vec3(dot(back.rgb, vec3(0.299,0.587,0.114)));',
		'	vec3 sumBG = vec3(dot(back.rgb, vec3(0.299,0.587,0.114)));',
        '   vec3 effectFG = mix( back.rgb, sumFG, - fIntensity);',
		'   vec3 effectBG = mix( back.rgb, sumBG, - bIntensity);',
		'	vec3 resultFG = effectFG * mask;',
		'	vec3 resultBG = effectBG * (1.0 - mask);',
		'	gl_FragColor.rgb = resultFG + resultBG;',
		'	gl_FragColor.a = max(mask, back.a);',
		'}'

	].join( '\n' )

};

export { SaturateDShader };
