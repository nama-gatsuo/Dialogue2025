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
const float PI = 3.1415926535897932384626433832795;
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
    vec3 col = vec3(0.1);
    vec2 pos = uv*2.0-1.0;
    
    // add multi center...
    vec2 center1 = vec2(sin(t * 0.1 + sin(t) * 0.1) * 0.5, sin(t * 0.15 - sin(t * 2.0) * 0.5) * 0.5); // modulate animation a bit...
    vec2 center2 = vec2(cos(t * 0.08) * 0.3, -sin(t * 0.12) * 0.3);
    vec2 center3 = vec2(-sin(t * 0.13) * 0.6, cos(t * 0.9) * 0.4);
    
    // center-dist
    float dist1 = distance(pos, center1);
    float dist2 = distance(pos, center2);
    float dist3 = distance(pos, center3);

    float gauss1 = exp(-(dist1 * dist1) / 0.3);
    float gauss2 = exp(-(dist2 * dist2) / 0.6);
    float gauss3 = exp(-(dist3 * dist3) / 1.0);
    
    float combinedGauss = gauss1 + gauss2 * 0.7 + gauss3 * 0.5 ;
    
    // slow down the time
    float slowTime = t * 0.2 * (1.0 + combinedGauss * 0.5);
    
    for(int i = 1; i < 6; i++){ 
        float noise = psuedoRandom(pos);
        
        pos.x += strength * sin(2.0*slowTime+float(i)*100.0 * pos.y*noise + dist1 * 5.0) + slowTime * 0.00001;
        pos.y += strength * cos(float(i)*50.0 * pos.x + dist2 * 8.0) + slowTime * 0.00002;
        
        float chaos_x = sin(pos.y*6.0 + slowTime*1.1 + dist3 * 10.0) * cos(pos.x*3.0 + slowTime*1.7);
        float chaos_y = cos(pos.x*1.0 + slowTime*10. + dist2 * 7.0) * sin(pos.y*1.3 + slowTime*0.3);
        pos += vec2(chaos_x, chaos_y) * 0.55 * combinedGauss;
    }
    float phase = slowTime;
    
    // stronger color
    vec3 color1 = vec3(
        0.5 + 0.6*sin(phase + pos.x*2.0 + 0.0),
        0.5 + 0.6*sin(phase + pos.y*2.0 + 2.1),
        0.5 + 0.6*sin(phase + pos.x*pos.y + 4.2)
    );
    
    vec3 color2 = vec3(
        0.5 + 0.6*sin(phase + pos.y*1.5 + 1.0),
        0.5 + 0.6*sin(phase + pos.x*1.5 + 3.1),
        0.5 + 0.6*sin(phase + pos.x*pos.y*0.5 + 5.2)
    );
    
    vec3 color3 = vec3(
        0.5 + 0.6*sin(phase + pos.x*3.0 + 2.0),
        0.5 + 0.6*sin(phase + pos.y*3.0 + 4.1),
        0.5 + 0.6*sin(phase + (pos.x+pos.y)*2.0 + 0.2)
    );
    
    // distance weight
    float weight1 = gauss1 * 0.2;
    float weight2 = gauss2 * 0.9;
    float weight3 = gauss3 * 1.0;
    
    float totalWeight = max(weight1 + weight2 + weight3 , 0.1);
    
    col = (color1 * weight1 + color2 * weight2 + color3 * weight3) / totalWeight;
    
    col = pow(col, vec3(0.45)); // 0.5 -> 0.45
    
    return vec4(col, 1.0); // 10.0 is meaningless lol
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
       
        //pos.x += sin(pos.x*0.04 + ii*0.01) * 10.0 * gaussTimeMain * (0.2 + loopGauss * 0.8);
        //pos.y += cos(pos.y*0.04 + ii*0.01) * 10.0 * gaussTimeMain * (0.2 + loopGauss * 0.8);

        float dist = distance(pos+ii, uv);

        vec2 sampleOffset = mod(vec2(psuedoRandom(uv), psuedoRandom(uv.yx)), vec2(distance(uv, vec2(0.5)) * 0.05)); // random dithering
        sampleOffset.x += sin(uv.y * 15.0 + time) * 0.02; // to distort whole image with wave

        // final color
        // I usually mess with this function a lot to see what's the surprise...
        vec4 wr = color_fun(uv,time*0.9*sin(uv.y)/uv.y+abs(pow(dist*0.2,0.45)));
        
        // wr = vec4(pow(wr.rgb, vec3(0.2)), 1.0); // make image super bright

        vec3 bright = pow(wr.rgb, vec3(0.7, 0.3, 0.4));
        vec3 original = wr.rgb;
        wr = vec4(mix(original, bright, 0.9), 1.0);  // 90% bright 10% original
    
        gl_FragColor = vec4(wr);
}
    
    }
