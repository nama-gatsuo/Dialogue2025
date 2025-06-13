#ifdef GL_ES
precision highp float;
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

// color correction function
vec3 ContrastSaturationBrightness(vec3 color, float brt, float sat, float con) {
    const float AvgLumR = 0.5;
    const float AvgLumG = 0.5;
    const float AvgLumB = 0.5;

    const vec3 LumCoeff = vec3(0.2125, 0.7154, 0.0721);
    
    vec3 AvgLumin  = vec3(AvgLumR, AvgLumG, AvgLumB);
    vec3 brtColor  = clamp(color,vec3(0),vec3(1)) * brt*1.01;
    vec3 intensity = vec3(dot(brtColor, LumCoeff));
    vec3 satColor  = mix(intensity, brtColor, sat);
    vec3 conColor  = mix(AvgLumin, satColor, con);

    return conColor;
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

    // Simple Caustics Calculation
    vec3 focus = vec3(4.0, 6.0, 8.0);
    vec3 timeFreq = vec3(3.0, 4.5, 6.0);
    vec3 distFreq = vec3(dist1, dist2, dist3);
    
    vec3 baseCaustics = 1.0 / (0.1 + distFreq * distFreq * focus);
    vec3 flickers = 0.5 + 0.5 * sin(slowTime * timeFreq + distFreq * distFreq);
    
    vec3 causticsVec = baseCaustics * flickers;
    float caustic1 = causticsVec.x;
    float caustic2 = causticsVec.y;
    float caustic3 = causticsVec.z;
    
    // ripple system
    vec2 waveDir1 = vec2(cos(slowTime * 0.01), sin(slowTime * 0.01));
    vec2 waveDir2 = vec2(cos(slowTime * 0.15 + 1.5), sin(slowTime * 0.15 + 1.5));
    vec2 waveDir3 = vec2(cos(slowTime * 0.08 + 3.0), sin(slowTime * 0.08 + 3.0));
    
    float wave1 = sin(dot(pos, waveDir1) * 12.0 - slowTime * 3.0) * 0.06;
    float wave2 = sin(dot(pos, waveDir2) * 8.0 - slowTime * 2.2) * 0.12;
    float wave3 = sin(dot(pos, waveDir3) * 15.0 - slowTime * 4.1) * 0.08;
    
    float totalWaveHeight = wave1 + wave2 + wave3;
    
    // lens reflection effect
    float lensStrength = 10.;
    // vec2 lensOffset1 = normalize(pos + center1) * lensStrength / (1.0 + dist1 * 1.0);
    // vec2 lensOffset2 = normalize(pos + center2) * lensStrength / (1.0 + dist2 * 2.0);
    // vec2 lensOffset3 = normalize(pos + center3) * lensStrength / (1.0 + dist3 * 3.0);
    vec2 lensOffset1 = normalize(pos + center1) * lensStrength / (1.0 + min(dist1, 2.0));  // 限制最大衰減
    vec2 lensOffset2 = normalize(pos + center2) * lensStrength / (1.0 + sqrt(dist1)); 
    vec2 lensOffset3= normalize(pos + center3) * lensStrength / (1.5 + sqrt(dist1));
    
    // apply lens offset
    pos += lensOffset1 + lensOffset2 * sin(time)*0.01 + lensOffset3 * 0.5;

    // radial ripples
    vec3 radialWaves = sin(distFreq * vec3(9.0, 10.0, 12.0) - slowTime * vec3(1.0, 1.8, 2.5)) 
                      * exp(-distFreq * vec3(1.5, 2.0, 1.2));
    float radialWaveHeight = dot(radialWaves, vec3(0.15, 0.12, 0.18));
    
    // combination of ripples
    float combinedWaveHeight = totalWaveHeight + radialWaveHeight * 0.5;
    
    // deformation+loop
    for(int i = 1; i < 6; i++){ 
        float noise = psuedoRandom(pos);
        
        // basic deformation
        pos.x += strength * sin(2.0*slowTime + float(i)*100.0 * pos.y * noise) + slowTime * 0.00001;
        pos.y += strength * cos(float(i)*50.0 * pos.x) + slowTime * 0.00002;
        
        // wave-influenced distortion! 🌊
        float waveInfluence = combinedWaveHeight * 15.0;
        float chaos_x = sin(pos.y*6.0 + slowTime*1.1 + waveInfluence) * cos(pos.x*3.0 + slowTime*1.7);
        float chaos_y = cos(pos.x*1.0 + slowTime*10. + waveInfluence) * sin(pos.y*1.3 + slowTime*0.3);
        
        // combine distortion..
        vec2 globalDeform = vec2(chaos_x, chaos_y) * 0.3;
        vec2 centerDeform = vec2(chaos_x, chaos_y) * 0.25 * combinedGauss;
        
        pos += globalDeform + centerDeform;
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
    
    float weight1 = gauss1 * 0.2;
    float weight2 = gauss2 * 0.9;
    float weight3 = gauss3 * 0.9;
    
    float totalWeight = max(weight1 + weight2 + weight3 , 0.1);
    
    col = (color1 * weight1 + color2 * weight2 + color3 * weight3) / totalWeight;
    
    col = pow(col, vec3(0.45)); // 0.5 -> 0.45
    
    // Caustics enhancement
    float totalCaustics = (caustic1 + caustic2 + caustic3) * 0.1;
    col += vec3(totalCaustics);
    
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
    
    for (int i = 0; i < 1; i++){
        float ii = float(i);
        float loopGauss = gaussian(sin(gaussTimeMain * 0.1 + ii * 0.1), 0.4);
       
        //pos.x += sin(pos.x*0.04 + ii*0.01) * 10.0 * gaussTimeMain * (0.2 + loopGauss * 0.8);
        //pos.y += cos(pos.y*0.04 + ii*0.01) * 10.0 * gaussTimeMain * (0.2 + loopGauss * 0.8);

        float dist = distance(pos+ii, uv);

        // vec2 sampleOffset = mod(
        //     vec2(psuedoRandom(ceil(uv*100.0)), psuedoRandom(ceil(uv*100.0))),
        //     vec2(0.001 + smoothstep(0.2, 0.5, distance(uv, vec2(0.5))) * 0.05)
        // ); // random dithering

        vec2 organicNoise = vec2(
            sin(uv.x * 20.0 + uv.y * 15.0 + time * 0.2) * 2.0,
            cos(uv.y * 18.0 + uv.x * 12.0 + time * 0.15) * 2.5
        );
        
        vec2 sampleOffset = vec2(
            psuedoRandom(floor(uv * 100.0 + organicNoise)), 
            psuedoRandom(floor(uv * 60.0 + organicNoise * 1.3))
        ) * (0.001 + smoothstep(0.05, 0.6, distance(uv, vec2(0.5))) * 0.02);
        
        // sampleOffset.x += sin(uv.y * ii) * 0.1; // to distort whole image with wave
        
        // final color
        // I usually mess with this function a lot to see what's the surprise...
        float osc = sin(time * 0.02) * 0.5 + sin(0.006 * time + cos(time * 0.1) * PI) * 8.0;
        vec4 wr = color_fun(uv + sampleOffset, osc*sin(uv.y)/uv.y+abs(pow(dist*0.2,0.45)));

        // wr = vec4(pow(wr.rgb, vec3(0.2)), 1.0); // make image super bright
        vec3 bright = pow(wr.rgb, vec3(0.7, 0.3, 0.4));
        vec3 original = wr.rgb;
        wr = vec4(mix(original, bright, 0.9), 1.0);  // 90% bright 10% original
        
        vec3 modCol = sin(wr.rgb * PI * 20.0) * 0.5 + 0.5;
        wr = vec4(mix(wr.rgb, modCol, 0.2), 1.0);

        // vec3 col0 = ContrastSaturationBrightness(wr.rgb, 1.0, abs(sin(time * 0.2)), 1.0);
        // vec3 col1 = ContrastSaturationBrightness(wr.gbr, 1.0,abs(time)+sin(time * 0.1), 1.0);
        // wr.rgb = mix(col0, col1, vec3(sin(time+atan(PI*0.005)), sin(time), sin(time+0.1)) * 0.3 + vec3(0.1));


        float sat1 = 0.5 + abs(sin(time * 0.2)) * 1.1;
        float sat2 = 0.4 + abs(sin(time * 0.1)) * 2.2;

        vec3 col0 = ContrastSaturationBrightness(wr.grb, 1.0, sat1, 1.0);
        vec3 col1 = ContrastSaturationBrightness(wr.rbg, 1.0, sat2, 1.0);
        wr.rgb = mix(col0, col1, sin(time * 0.6) * 0.3 + 0.5);

        gl_FragColor = wr;
        
    }
}
