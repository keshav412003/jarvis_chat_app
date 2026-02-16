"use client";

import React, { useEffect, useRef } from 'react';

const SplashCursor = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Fluid simulation configuration
        const config = {
            SIM_RESOLUTION: 128,
            DYE_RESOLUTION: 1024,
            CAPTURE_RESOLUTION: 512,
            DENSITY_DISSIPATION: 4, // Disappears much faster
            VELOCITY_DISSIPATION: 2, // Trails slow down quicker
            PRESSURE: 0.8,
            PRESSURE_ITERATIONS: 20,
            CURL: 30,
            SPLAT_RADIUS: 0.15, // Smaller, more precise splats
            SPLAT_FORCE: 6000,
            SHADING: true,
            COLORFUL: true,
            COLOR_UPDATE_SPEED: 10,
            PAUSED: false,
            BACK_COLOR: { r: 0, g: 0, b: 0 },
            TRANSPARENT: true,
        };

        function pointerPrototype() {
            this.id = -1;
            this.texcoordX = 0;
            this.texcoordY = 0;
            this.prevTexcoordX = 0;
            this.prevTexcoordY = 0;
            this.deltaX = 0;
            this.deltaY = 0;
            this.down = false;
            this.moved = false;
            this.color = [30, 0, 300];
        }

        let pointers = [new pointerPrototype()];
        let splatStack = [];

        const { gl, ext } = getWebGLContext(canvas);

        if (!ext.supportLinearFiltering) {
            config.DYE_RESOLUTION = 256;
            config.SHADING = false;
        }

        function getWebGLContext(canvas) {
            const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
            let gl = canvas.getContext('webgl2', params);
            const isWebGL2 = !!gl;
            if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

            let halfFloat;
            let supportLinearFiltering;
            if (isWebGL2) {
                gl.getExtension('EXT_color_buffer_float');
                supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
            } else {
                halfFloat = gl.getExtension('OES_texture_half_float');
                supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
            }

            gl.clearColor(0.0, 0.0, 0.0, 1.0);

            const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
            let formatRGBA;
            let formatRG;
            let formatR;

            if (isWebGL2) {
                formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
                formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
                formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
            } else {
                formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
                formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
                formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            }

            return {
                gl,
                ext: {
                    formatRGBA,
                    formatRG,
                    formatR,
                    halfFloatTexType,
                    supportLinearFiltering
                }
            };
        }

        function getSupportedFormat(gl, internalFormat, format, type) {
            if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
                switch (internalFormat) {
                    case gl.R16F: return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                    case gl.RG16F: return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                    default: return null;
                }
            }
            return { internalFormat, format };
        }

        function supportRenderTextureFormat(gl, internalFormat, format, type) {
            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

            let fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            return status == gl.FRAMEBUFFER_COMPLETE;
        }

        class Material {
            constructor(vertexShader, fragmentShaderSource) {
                this.vertexShader = vertexShader;
                this.fragmentShaderSource = fragmentShaderSource;
                this.programs = [];
                this.activeProgram = null;
                this.uniforms = [];
            }
            setKeywords(keywords) {
                let hash = 0;
                for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

                let program = this.programs[hash];
                if (program == null) {
                    let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
                    program = createProgram(this.vertexShader, fragmentShader);
                    this.programs[hash] = program;
                }

                if (program == this.activeProgram) return;

                this.uniforms = getUniforms(program);
                this.activeProgram = program;
            }
            bind() {
                gl.useProgram(this.activeProgram);
            }
        }

        function hashCode(s) {
            if (s.length == 0) return 0;
            let hash = 0;
            for (let i = 0; i < s.length; i++) {
                hash = (hash << 5) - hash + s.charCodeAt(i);
                hash |= 0;
            }
            return hash;
        }

        function getUniforms(program) {
            let uniforms = [];
            let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) {
                let uniformName = gl.getActiveUniform(program, i).name;
                uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
            }
            return uniforms;
        }

        function compileShader(type, source, keywords) {
            source = addKeywords(source, keywords);
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(shader);
            return shader;
        }

        function addKeywords(source, keywords) {
            if (keywords == null) return source;
            let keywordsString = '';
            keywords.forEach(keyword => { keywordsString += '#define ' + keyword + '\n ' });
            return keywordsString + source;
        }

        function createProgram(vertexShader, fragmentShader) {
            let program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw gl.getProgramInfoLog(program);
            return program;
        }

        const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
            precision highp float;
            attribute vec2 aPosition;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform vec2 texelSize;
            void main () {
                vUv = aPosition * 0.5 + 0.5;
                vL = vUv - vec2(texelSize.x, 0.0);
                vR = vUv + vec2(texelSize.x, 0.0);
                vT = vUv + vec2(0.0, texelSize.y);
                vB = vUv - vec2(0.0, texelSize.y);
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `);

        const displayShaderSource = `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uTexture;
            uniform sampler2D uBloom;
            uniform sampler2D uSunrays;
            uniform sampler2D uDithering;
            uniform vec2 ditherScale;
            uniform vec2 texelSize;

            vec3 linearToGamma (vec3 color) {
                color = max(color, vec3(0));
                return pow(color, vec3(1.0 / 2.2));
            }

            void main () {
                vec3 c = texture2D(uTexture, vUv).rgb;
            #ifdef SHADING
                vec3 lc = texture2D(uTexture, vL).rgb;
                vec3 rc = texture2D(uTexture, vR).rgb;
                vec3 tc = texture2D(uTexture, vT).rgb;
                vec3 bc = texture2D(uTexture, vB).rgb;

                float dx = length(rc) - length(lc);
                float dy = length(tc) - length(bc);

                vec3 n = normalize(vec3(dx, dy, 0.1));
                vec3 l = vec3(0.0, 0.0, 1.0);
                float diffuse = max(0.0, dot(n, l));
                c *= diffuse;
            #endif
                c = linearToGamma(c);
                gl_FragColor = vec4(c, 1.0);
                if (gl_FragColor.rgb == vec3(0.0)) discard;
            }
        `;

        const splatShaderSource = `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            uniform sampler2D uTarget;
            uniform float aspect;
            uniform vec3 color;
            uniform vec2 point;
            uniform float radius;

            void main () {
                vec2 p = vUv - point.xy;
                p.x *= aspect;
                vec3 splat = exp(-dot(p, p) / radius) * color;
                vec3 base = texture2D(uTarget, vUv).xyz;
                gl_FragColor = vec4(base + splat, 1.0);
            }
        `;

        const advectionShaderSource = `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform vec2 dyeTexelSize;
            uniform float dt;
            uniform float dissipation;

            vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
                vec2 st = uv / tsize - 0.5;
                vec2 iuv = floor(st);
                vec2 fuv = fract(st);

                vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
                vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
                vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
                vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

                return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
            }

            void main () {
            #ifdef ADVECTION_ATTRIBUTE
                vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
            #else
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            #endif
                vec4 result = bilerp(uSource, coord, dyeTexelSize);
                float decay = 1.0 + dt * dissipation;
                gl_FragColor = result / decay;
            }
        `;

        const divergenceShaderSource = `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;

            void main () {
                float L = texture2D(uVelocity, vL).x;
                float R = texture2D(uVelocity, vR).x;
                float T = texture2D(uVelocity, vT).y;
                float B = texture2D(uVelocity, vB).y;

                vec2 C = texture2D(uVelocity, vUv).xy;
                if (vL.x < 0.0) { L = -C.x; }
                if (vR.x > 1.0) { R = -C.x; }
                if (vT.y > 1.0) { T = -C.y; }
                if (vB.y < 0.0) { B = -C.y; }

                float div = 0.5 * (R - L + T - B);
                gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
            }
        `;

        const curlShaderSource = `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;

            void main () {
                float L = texture2D(uVelocity, vL).y;
                float R = texture2D(uVelocity, vR).y;
                float T = texture2D(uVelocity, vT).x;
                float B = texture2D(uVelocity, vB).x;
                float curl = R - L - T + B;
                gl_FragColor = vec4(0.5 * curl, 0.0, 0.0, 1.0);
            }
        `;

        const vorticityShaderSource = `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            uniform sampler2D uCurl;
            uniform float curl;
            uniform float dt;

            void main () {
                float L = texture2D(uCurl, vL).x;
                float R = texture2D(uCurl, vR).x;
                float T = texture2D(uCurl, vT).x;
                float B = texture2D(uCurl, vB).x;
                float C = texture2D(uCurl, vUv).x;

                vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
                force /= length(force) + 0.0001;
                force *= curl * C;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                gl_FragColor = vec4(velocity + force * dt, 0.0, 1.0);
            }
        `;

        const pressureShaderSource = `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uDivergence;

            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                float C = texture2D(uPressure, vUv).x;
                float divergence = texture2D(uDivergence, vUv).x;
                float pressure = (L + R + B + T - divergence) * 0.25;
                gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
            }
        `;

        const gradientSubtractShaderSource = `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uVelocity;

            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                velocity.x -= 0.5 * (R - L);
                velocity.y -= 0.5 * (T - B);
                gl_FragColor = vec4(velocity, 0.0, 1.0);
            }
        `;

        const displayMaterial = new Material(baseVertexShader, displayShaderSource);
        const splatMaterial = new Material(baseVertexShader, splatShaderSource);
        const advectionMaterial = new Material(baseVertexShader, advectionShaderSource);
        const divergenceMaterial = new Material(baseVertexShader, divergenceShaderSource);
        const curlMaterial = new Material(baseVertexShader, curlShaderSource);
        const vorticityMaterial = new Material(baseVertexShader, vorticityShaderSource);
        const pressureMaterial = new Material(baseVertexShader, pressureShaderSource);
        const gradientSubtractMaterial = new Material(baseVertexShader, gradientSubtractShaderSource);

        function createFBO(w, h, internalFormat, format, type, param) {
            gl.activeTexture(gl.TEXTURE0);
            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

            let fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.viewport(0, 0, w, h);
            gl.clear(gl.COLOR_BUFFER_BIT);

            let texelSizeX = 1.0 / w;
            let texelSizeY = 1.0 / h;

            return {
                texture,
                fbo,
                width: w,
                height: h,
                texelSizeX,
                texelSizeY,
                attach(id) {
                    gl.activeTexture(gl.TEXTURE0 + id);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    return id;
                }
            };
        }

        function createDoubleFBO(w, h, internalFormat, format, type, param) {
            let fbo1 = createFBO(w, h, internalFormat, format, type, param);
            let fbo2 = createFBO(w, h, internalFormat, format, type, param);

            return {
                width: w,
                height: h,
                texelSizeX: fbo1.texelSizeX,
                texelSizeY: fbo1.texelSizeY,
                get read() {
                    return fbo1;
                },
                get write() {
                    return fbo2;
                },
                swap() {
                    let temp = fbo1;
                    fbo1 = fbo2;
                    fbo2 = temp;
                }
            };
        }

        function resizeFBO(target, w, h, internalFormat, format, type, param) {
            let newFBO = createDoubleFBO(w, h, internalFormat, format, type, param);
            return newFBO;
        }

        let density;
        let velocity;
        let divergence;
        let curl;
        let pressure;

        function initFramebuffers() {
            let simRes = getResolution(config.SIM_RESOLUTION);
            let dyeRes = getResolution(config.DYE_RESOLUTION);

            const texType = ext.halfFloatTexType;
            const rgba = ext.formatRGBA;
            const rg = ext.formatRG;
            const r = ext.formatR;
            const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

            gl.disable(gl.BLEND);

            if (gl.isTexture(density?.read?.texture)) gl.deleteTexture(density.read.texture);
            if (gl.isTexture(density?.write?.texture)) gl.deleteTexture(density.write.texture);
            if (gl.isTexture(velocity?.read?.texture)) gl.deleteTexture(velocity.read.texture);
            if (gl.isTexture(velocity?.write?.texture)) gl.deleteTexture(velocity.write.texture);
            if (gl.isTexture(divergence?.texture)) gl.deleteTexture(divergence.texture);
            if (gl.isTexture(curl?.texture)) gl.deleteTexture(curl.texture);
            if (gl.isTexture(pressure?.read?.texture)) gl.deleteTexture(pressure.read.texture);
            if (gl.isTexture(pressure?.write?.texture)) gl.deleteTexture(pressure.write.texture);

            density = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
            velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
            divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
            curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
            pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        }

        function getResolution(resolution) {
            let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
            if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

            let min = resolution;
            let max = Math.round(resolution * aspectRatio);

            if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
            else return { width: min, height: max };
        }

        function update() {
            if (config.PAUSED) return;
            resizeCanvas();
            step(0.016);
            render(null);
            requestAnimationFrame(update);
        }

        function step(dt) {
            gl.disable(gl.BLEND);

            // Advection
            advectionMaterial.setKeywords([]);
            advectionMaterial.bind();
            gl.uniform2f(advectionMaterial.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform2f(advectionMaterial.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(advectionMaterial.uniforms.uVelocity, velocity.read.attach(0));
            gl.uniform1i(advectionMaterial.uniforms.uSource, velocity.read.attach(1));
            gl.uniform1f(advectionMaterial.uniforms.dt, dt);
            gl.uniform1f(advectionMaterial.uniforms.dissipation, config.VELOCITY_DISSIPATION);
            blit(velocity.write);
            velocity.swap();

            gl.uniform2f(advectionMaterial.uniforms.dyeTexelSize, density.texelSizeX, density.texelSizeY);
            gl.uniform1i(advectionMaterial.uniforms.uSource, density.read.attach(1));
            gl.uniform1f(advectionMaterial.uniforms.dissipation, config.DENSITY_DISSIPATION);
            blit(density.write);
            density.swap();

            // Splats
            for (let i = 0; i < pointers.length; i++) {
                const p = pointers[i];
                if (p.moved) {
                    p.moved = false;
                    splat(p.texcoordX, p.texcoordY, p.deltaX, p.deltaY, p.color);
                }
            }
            for (let i = 0; i < splatStack.length; i++) {
                const s = splatStack.pop();
                splat(s.x, s.y, s.dx, s.dy, s.color);
            }

            // Curl
            curlMaterial.setKeywords([]);
            curlMaterial.bind();
            gl.uniform2f(curlMaterial.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(curlMaterial.uniforms.uVelocity, velocity.read.attach(0));
            blit(curl);

            // Vorticity
            vorticityMaterial.setKeywords([]);
            vorticityMaterial.bind();
            gl.uniform2f(vorticityMaterial.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(vorticityMaterial.uniforms.uVelocity, velocity.read.attach(0));
            gl.uniform1i(vorticityMaterial.uniforms.uCurl, curl.attach(1));
            gl.uniform1f(vorticityMaterial.uniforms.curl, config.CURL);
            gl.uniform1f(vorticityMaterial.uniforms.dt, dt);
            blit(velocity.write);
            velocity.swap();

            // Divergence
            divergenceMaterial.setKeywords([]);
            divergenceMaterial.bind();
            gl.uniform2f(divergenceMaterial.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(divergenceMaterial.uniforms.uVelocity, velocity.read.attach(0));
            blit(divergence);

            // Pressure
            pressureMaterial.setKeywords([]);
            pressureMaterial.bind();
            gl.uniform2f(pressureMaterial.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(divergenceMaterial.uniforms.uDivergence, divergence.attach(0));
            for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
                gl.uniform1i(pressureMaterial.uniforms.uPressure, pressure.read.attach(1));
                blit(pressure.write);
                pressure.swap();
            }

            // Gradient Subtract
            gradientSubtractMaterial.setKeywords([]);
            gradientSubtractMaterial.bind();
            gl.uniform2f(gradientSubtractMaterial.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
            gl.uniform1i(gradientSubtractMaterial.uniforms.uPressure, pressure.read.attach(0));
            gl.uniform1i(gradientSubtractMaterial.uniforms.uVelocity, velocity.read.attach(1));
            blit(velocity.write);
            velocity.swap();
        }

        function splat(x, y, dx, dy, color) {
            gl.disable(gl.BLEND);
            splatMaterial.setKeywords([]);
            splatMaterial.bind();
            gl.uniform1i(splatMaterial.uniforms.uTarget, velocity.read.attach(0));
            gl.uniform1f(splatMaterial.uniforms.aspect, canvas.width / canvas.height);
            gl.uniform2f(splatMaterial.uniforms.point, x, y);
            gl.uniform3f(splatMaterial.uniforms.color, dx, dy, 0.0);
            gl.uniform1f(splatMaterial.uniforms.radius, config.SPLAT_RADIUS / 100.0);
            blit(velocity.write);
            velocity.swap();

            gl.uniform1i(splatMaterial.uniforms.uTarget, density.read.attach(0));
            gl.uniform3f(splatMaterial.uniforms.color, color.r, color.g, color.b);
            blit(density.write);
            density.swap();
        }

        function render(target) {
            gl.viewport(0, 0, canvas.width, canvas.height);

            if (config.TRANSPARENT) {
                gl.disable(gl.BLEND);
                gl.clearColor(0, 0, 0, 0);
            } else {
                gl.disable(gl.BLEND);
                gl.clearColor(config.BACK_COLOR.r, config.BACK_COLOR.g, config.BACK_COLOR.b, 1.0);
            }
            gl.clear(gl.COLOR_BUFFER_BIT);

            let keywords = [];
            if (config.SHADING) keywords.push("SHADING");
            displayMaterial.setKeywords(keywords);
            displayMaterial.bind();
            gl.uniform1i(displayMaterial.uniforms.uTexture, density.read.attach(0));
            blit(target);
        }

        function blit(target) {
            if (target == null) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
                gl.viewport(0, 0, target.width, target.height);
            }
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        function resizeCanvas() {
            if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                initFramebuffers();
            }
        }

        const blitData = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, blitData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        initFramebuffers();
        update();

        const onMouseMove = (e) => {
            let pointer = pointers[0];
            pointer.moved = pointer.down;
            pointer.prevTexcoordX = pointer.texcoordX;
            pointer.prevTexcoordY = pointer.texcoordY;
            pointer.texcoordX = e.clientX / canvas.width;
            pointer.texcoordY = 1.0 - e.clientY / canvas.height;
            pointer.deltaX = (pointer.texcoordX - pointer.prevTexcoordX) * config.SPLAT_FORCE;
            pointer.deltaY = (pointer.texcoordY - pointer.prevTexcoordY) * config.SPLAT_FORCE;

            // Randomly update color
            if (Math.random() > 0.9) {
                pointer.color = generateColor();
            }
            pointer.down = true; // For desktop, always assume down for trail
        };

        const generateColor = () => {
            let colors = [
                { r: 0.2, g: 0.5, b: 1 }, // Soft Sky Blue
                { r: 0.5, g: 0.2, b: 0.8 }, // Deep Purple
                { r: 0.1, g: 0.8, b: 0.8 }, // Teal
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        };

        window.addEventListener('mousemove', onMouseMove);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            config.PAUSED = true;
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[1]"
            style={{ width: '100vw', height: '100vh' }}
        />
    );
};

export default SplashCursor;
