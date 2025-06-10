#ifdef GL_ES
precision mediump float;
#endif

// basic setting
varying vec2 vTexCoord;
uniform float time;
uniform float width;
uniform float height;
uniform sampler2D colorTex;

// gaussian fun
float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma));
}

// 2D gaussian fun
float gaussian2D(vec2 pos, float sigma) {
    float dist = length(pos);
    return exp(-(dist * dist) / (2.0 * sigma * sigma));
}

float psuedoRandom(vec2 pos) {
    return fract(sin(dot(pos, vec2(12.9898, 78.233))) * 43758.5453);
}

// This function is just all about color :)
vec4 color_fun(in vec2 uv, float t){
    float strength = 0.02;
    vec3 col = vec3(0.0);
    vec2 pos = uv*2.0-1.0;
    
    // gaussian center point
    vec2 center1 = vec2(sin(t * 0.1 + sin(t) * 0.1) * 0.5, sin(t * 0.15 - sin(t * 2.0) * 0.5) * 0.5); // modulate animation a bit...
    vec2 center2 = vec2(cos(t * 0.08) * 0.3, sin(t * 0.12) * 0.3);
    
    // center-dist
    float gauss1 = gaussian2D(pos - center1, 0.4);
    float gauss2 = gaussian2D(pos - center2, 0.6);
    float combinedGauss = gauss1 + gauss2 * 0.5;
    
    // slow down the time
    float slowTime = t * 0.2 * (1.0 + combinedGauss * 0.5);
    
    for(int i = 1; i < 6; i++){ 
        //noise fun
        float noise = psuedoRandom(pos);
        
        pos.x += strength * sin(2.0*slowTime+float(i)*100.0 * pos.y*noise) + slowTime * 0.00001;
        pos.y += strength * cos(float(i)*50.0 * pos.x);
        
        float chaos_x = sin(pos.y*6.0 + slowTime*1.1) * cos(pos.x*3.0 + slowTime*1.7);
        float chaos_y = cos(pos.x*1.0 + slowTime*10.) * sin(pos.y*1.3 + slowTime*0.3);
        pos += vec2(chaos_x, chaos_y) * 0.55 * combinedGauss;
    }
    
    col += 0.5 + 0.5*sin(slowTime+pos.xyx+pos.yyy+pos.xxx+vec3(0.675,0.239,2.000));
    col = pow(col, vec3(0.5));
    return vec4(col,10.0);
}

void main()
{
    //shader position
    vec2 uv = vTexCoord;
    vec2 pos = uv * vec2(width, height);
    vec2 center = vec2(width/2.0, height/2.0);

    // slow down the time
    float gaussTimeMain = time * 0.05; 
    
    for (int i = 0; i < 10; i++){
        float ii = float(i);
        float loopGauss = gaussian(sin(gaussTimeMain * 0.1 + ii * 0.1), 0.4);
       
        pos.x += sin(pos.x*0.04 + ii*0.01) * 10.0 * gaussTimeMain * (0.2 + loopGauss * 0.8);
        pos.y += cos(pos.y*0.04 + ii*0.01) * 10.0 * gaussTimeMain * (0.2 + loopGauss * 0.8);
    }
    
    vec2 sampleOffset = mod(vec2(psuedoRandom(uv), psuedoRandom(uv.yx)), vec2(distance(uv, vec2(0.5)) * 0.05)); // random dithering
    sampleOffset.x += sin(uv.y * 15.0 + time) * 0.02; // to distort whole image with wave
    // final color
    vec4 wr = color_fun(uv + sampleOffset, time);
    wr = vec4(pow(wr.rgb, vec3(0.2)), 1.0); // make image super bright
    gl_FragColor = vec4(wr);
}
