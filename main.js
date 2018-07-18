'use strict';

(async _ => {
//

let debounceUrl, debounceGamma;

let vtkLoader = new THREE.VTKLoader();
let plyLoader = new THREE.PLYLoader();
let stlLoader = new THREE.STLLoader();
let config = window.config || window.parent.config;

if (!config) {
    console.log("No config found...using default config (debug-surfaces.json)");
    config = {};
    config.debug = true;
    let debugSurfaces = await fetch('debug-surfaces.json');
    config.surfaces = await debugSurfaces.json();
}

Vue.component("controller", {
    props: [ "morphing", "meshes", "visible" ],
    data: function() {
        return {
            rotate: false,
            para3d: false,
            inflation: 0,
            all: true,
            
            niftis: [],
            selected_nifti: null,
            gamma: 1,
            
            sortedMeshes: [],
        }
    },
    
    watch: {
        all: function() {
            this.meshes.forEach(_m=>{
                _m.mesh.visible = this.all;
            });
        },
        rotate: function() {
            this.$emit('rotate');
        },
        para3d: function() {
            this.$emit('para3d', this.para3d);
        },
        gamma: function() {
            this.$emit('gamma', this.gamma);
        },
        inflation: function() {
            this.$emit('inflate', this.inflation);
        },
        meshes: function() {
            this.sortedMeshes = this.meshes.map(m => m).sort((a, b) => {
                let resBool = 0;
                if (a.display_name.startsWith("Right")) {
                    if (b.display_name.startsWith("Right")) resBool = a.display_name.substring(5) > b.display_name.substring(5);
                    else resBool = true;
                } else if (a.display_name.startsWith("Left")) {
                    if (b.display_name.startsWith("Left")) resBool = a.display_name.substring(4) > b.display_name.substring(4);
                    else resBool = !b.display_name.startsWith("Right");
                } else if (b.display_name.startsWith("Left") || b.display_name.startsWith("Right")) resBool = false;
                else {
                    resBool = a.display_name > b.display_name;
                }
                return resBool ? 1 : -1;
            });
        },
        selected_nifti: function(nifti) {
            if (typeof nifti == 'number') {
                this.$emit('overlay', this.niftis[nifti]);
            }
            else {
                this.$emit('overlay', null);
            }
        },
    },
    methods: {
        upload_file: function(e) {
            let file = e.target.files[0];
            if (!file) return;
            
            let reader = new FileReader();
            reader.addEventListener('load', buffer=>{
                this.niftis.push({ user_uploaded: true, filename: file.name, buffer: reader.result });
                this.selected_nifti = this.niftis.length - 1;
            });
            reader.readAsArrayBuffer(file);
        },
    },
    
    template: `
        <div :class="{ 'controls': true, 'visible': visible }" style="max-width: 250px;">
            <div class="control">
                <input type="checkbox" v-model="rotate" /> Rotate
                <input type="checkbox" v-model="para3d" /> 3D
                <table style="width: 200px;" v-if="morphing">
                    <tr>
                        <td style="width:100%;">
                        <input type="range" min="0" max="1" step=".05" v-model="inflation" style="width: 100%;" />
                        </td>
                        <td>
                            Inflation
                        </td>
                    </tr>
                </table>
            </div>
            <hr>
            <h3>Surfaces</h3>
            <div style="overflow-y:auto;overflow-x:hidden;max-height:48vh;">
                <div class="control">
                    <input type="checkbox" v-model="all"></input> (All)</input>
                </div>
                <div class="control" v-for="_m in sortedMeshes">
                    <input type="checkbox" v-model="_m.mesh.visible"></input> {{_m.display_name}}
                </div>
            </div>
            
            <div v-if="niftis.length > 0">
                <div>Overlay:
                    <select v-model="selected_nifti">
                        <option :value="null">(No Overlay)</option>
                        <option v-for="(n, i) in niftis" :value="i">{{n.filename}}</option>
                    </select>
                </div>
                <div>
                    Gamma:
                    <input type='number' v-model='gamma' min='0.0001' step='.01' />
                </div>
            </div>
            <div class="upload_div">
                <label for="upload_nifti">Upload Overlay Image (.nii.gz)</label>
                <input type="file" style="visibility:hidden;max-height:0;max-width:5px;" name="upload_nifti" id="upload_nifti" @change="upload_file"></input>
            </div>
        </div>
    `,
});

new Vue({
    el: "#app",
    template: `
        <div style="height: 100%; position: relative;">
            <controller v-if="controls" :meshes="meshes" :visible="controlsVisible" :morphing="morphing" @rotate="toggle_rotate()" id="controller" @para3d="set_para3d" @gamma="set_gamma" @inflate="inflate" @overlay="overlay" />
            <h2 id="loading" v-if="loaded < total_surfaces">Loading <small>({{round(loaded / total_surfaces)}}%)</small>...</h2>
            <div ref="main" class="main"></div>
            <div ref="tinyBrain" class="tinyBrain"></div>
            <div class='show_hide_button' @click="controlsVisible = !controlsVisible">&#9776;</div>
        </div>
    `,
    components: [ "controller" ],
    data() {
        return {
            //var views = document.getElementById("views");
            //surfaces: [], //surface scenes
            loaded: 0,
            total_surfaces: config.surfaces.length,

            //main components
            effect: null,
            scene: null, 
            scene_overlay: null, 
            camera: null,
            renderer: null,
            controls: null,
            pointLight: null,
            pointLight_overlay: null,
            
            tinyBrainMesh: null,
            tinyBrainScene: null,
            tinyBrainCam: null,
            brainRenderer: null,
            brainLight: null,
            
            controlsVisible: true,
            
            color_map: null,
            color_map_affine: null,
            color_map_head: null,
            gamma: 1,
            inflation: 0,
            
            //loaded meshes
            meshes: [],
            // groupings of mesh for nifti overlay
            visual_weights: [],
            // for morphTarget transformation
            filename2geometry: {},
            morphing: false,
            
            stats: {
                max: null,
                min: null,
                
                sum: null,
                mean: null,
                
                stddev: null,
                stddev_m5: null,
                stddev_5: null,
            }
        }
    },
    watch: {
        loaded: function() {
            if (this.total_surfaces > 0 && this.loaded == this.total_surfaces) {
                this.recalculate_materials();
            }
        },
    },
    
    mounted: function() {
        //tiny brain
        let loader = new THREE.ObjectLoader();
        loader.load('models/brain.json', _scene => {
            this.tinyBrainScene = _scene;
            this.tinyBrainMesh = this.tinyBrainScene.children[1];
            // align the tiny brain with the model
            
            this.tinyBrainMesh.rotation.z -= Math.PI / 2;
            this.tinyBrainMesh.rotation.y += Math.PI;
            this.tinyBrainMesh.rotation.x -= Math.PI / 2;
            this.tinyBrainMesh.material = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
            
            this.tinyBrainScene = new THREE.Scene();
            this.tinyBrainScene.add(this.tinyBrainMesh);
            
            let bb = {};
            this.tinyBrainMesh.geometry.vertices.forEach(v => {
                bb.min = bb.min || v;
                bb.max = bb.max || v;
                if (v.x > bb.max.x) bb.max.x = v.x;
                if (v.y > bb.max.y) bb.max.y = v.y;
                if (v.z > bb.max.z) bb.max.z = v.z;
                
                if (v.x < bb.min.x) bb.min.x = v.x;
                if (v.y < bb.min.y) bb.min.y = v.y;
                if (v.z < bb.min.z) bb.min.z = v.z;
            });
            this.tinyBrainMesh.position.set(
                (bb.max.x - bb.min.x) / 2,
                (bb.max.y - bb.min.y) / 2,
                (bb.max.z - bb.min.z) / 2,
            );
            
            this.brainLight = new THREE.PointLight(0xffffff, 1);
            this.brainLight.radius = 20;
            this.brainLight.position.copy(this.tinyBrainCam.position);
            this.tinyBrainScene.add(this.brainLight);
            if (config.debug) {
                this.tinyBrainScene.add( new THREE.AxesHelper( 10 ) );
            }
        });
        
        //TODO update to make it look like
        //view-source:https://threejs.org/examples/webgl_multiple_elements.html
        
        let vm = this;
        let width = this.$refs.main.clientWidth,
            height = this.$refs.main.clientHeight,
            tinyBrainWidth = this.$refs.tinyBrain.clientWidth,
            tinyBrainHeight = this.$refs.tinyBrain.clientHeight;

        //init..
        this.scene = new THREE.Scene();
        this.scene_overlay = new THREE.Scene();
        this.updateBackground();
        //this.scene.fog = new THREE.Fog( 0x000000, 250, 1000 );
        
        if (config.debug) {
            this.scene.add( new THREE.AxesHelper( 100 ) );
        }

        //camera/renderer
        this.camera = new THREE.PerspectiveCamera( 45, width / height, 1, 5000);
        this.tinyBrainCam = new THREE.PerspectiveCamera(45, tinyBrainWidth / tinyBrainHeight, 1, 5000);
        this.camera.up = new THREE.Vector3(0, 0, 1);
        // this.tinyBrainCam.up = new THREE.Vector3(0, 0, 1);
        
        //this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        this.renderer = new THREE.WebGLRenderer();
        this.brainRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.autoClear = false;

        //https://github.com/mrdoob/three.js/blob/master/examples/webgl_effects_parallaxbarrier.html
        this.effect = new THREE.ParallaxBarrierEffect( this.renderer );
        this.effect.setSize( width, height );
        
        this.$refs.main.append(this.renderer.domElement);
        this.camera.position.y = 200;
        this.scene.add(this.camera);
        
        this.$refs.tinyBrain.appendChild(this.brainRenderer.domElement);
        
        //light
        var amblight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(amblight);

        this.pointLight = new THREE.PointLight(0xffffff, 0.7);
        this.pointLight_overlay = new THREE.PointLight(0xffffff, 0.7);
        
        this.pointLight.position.set(-2000, 2000, -5000);
        this.pointLight_overlay.position.set(-2000, 2000, -5000);
        
        this.scene.add(this.pointLight);
        this.scene_overlay.add(this.pointLight_overlay);
        
        //controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.addEventListener('change', e=>{
            let vm = this;
            let timeout = setTimeout(function() {
                if (timeout == debounceUrl) {
                    // rotation changes
                    let pan = vm.controls.getPanOffset();

                    // save camera information in url
                    let pos_params = [ vm.approx(vm.camera.position.x), vm.approx(vm.camera.position.y), vm.approx(vm.camera.position.z)].join(";");
                    let target_params = [ vm.approx(vm.controls.target.x), vm.approx(vm.controls.target.y), vm.approx(vm.controls.target.z)].join(";");
                    window.location = "#where=" + pos_params + "/" + target_params;
                }
            }, 700);
            debounceUrl = timeout;
        });
        this.controls.enableKeys = false;
        
        //url
        let info_string = getHashValue('where');
        if (info_string) {
            let info = info_string.split('/');
            let pos = (info[0] || '').split(';');
            let orig = (info[1] || '').split(';');

            if (pos) {
                this.camera.position.x = +pos[0];
                this.camera.position.y = +pos[1];
                this.camera.position.z = +pos[2];
            }
            if (orig) {
                this.controls.target.x = +orig[0];
                this.controls.target.y = +orig[1];
                this.controls.target.z = +orig[2];

                this.controls.setPubPanOffset(+orig[0], +orig[1], +orig[2]);
            }
        }

        window.addEventListener("resize", this.resize);
        this.resize();
        this.animate();

        /*
        //test
        var geometry = new THREE.BoxGeometry( 50, 50, 25 );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var cube = new THREE.Mesh( geometry, material );
        this.scene.add( cube );
        */

        //start loading surfaces geometries
        async.each(config.surfaces, this.load_surface);
    },

    methods: {
        round: function(percentage) {
            return Math.round(percentage * 100);
        },
        approx: function(v) {
            return Math.round(v * 1e3) / 1e3;
        },

        resize: function() {
            let width = this.$refs.main.clientWidth,
                height = this.$refs.main.clientHeight,
                tinyBrainWidth = this.$refs.tinyBrain.clientWidth,
                tinyBrainHeight = this.$refs.tinyBrain.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.effect.setSize( width, height );
            
            this.brainRenderer.setSize(tinyBrainWidth, tinyBrainHeight);
            this.tinyBrainCam.aspect = tinyBrainWidth / tinyBrainHeight;
            this.tinyBrainCam.updateProjectionMatrix();
        },

        set_para3d: function(it) {
            this.para3d = it;
        },
        set_gamma: function(gamma) {
            gamma = Math.max(gamma, 0.0001);
            let vm = this;
            let tmp = setTimeout(function() {
                if (debounceGamma == tmp) {
                    vm.gamma = gamma;
                    if (vm.color_map) {
                        vm.meshes.forEach(object => {
                            object.mesh.material.uniforms.gamma.value = vm.gamma;
                        });
                        
                        let weightWithGamma;
                        vm.particles.forEach(layer => {
                            if (!layer) return;
                            if (layer._weight) {
                                weightWithGamma = Math.pow(layer._weight, 1 / vm.gamma);
                                layer.material.color = new THREE.Color(weightWithGamma, weightWithGamma, weightWithGamma);
                            }
                        });
                    }
                    
                    vm.updateBackground();
                }
            }, 400);
            debounceGamma = tmp;
        },

        animate: function() {
            requestAnimationFrame(this.animate);
            this.pointLight.position.copy(this.camera.position);
            this.pointLight_overlay.position.copy(this.camera.position);
            this.controls.update();
            if(this.para3d) {
                this.effect.render(this.scene, this.camera);
            } else {
                this.renderer.clear();
                this.renderer.render( this.scene, this.camera );
                this.renderer.clearDepth();
                // this.renderer.render( this.scene_overlay, this.camera );
            }
            
            if (this.tinyBrainScene) {
                // normalize the main camera's position so that the tiny brain camera is always the same distance away from <0, 0, 0>
                let pan = this.controls.getPanOffset();
                let pos3 = new THREE.Vector3(
                        this.camera.position.x - pan.x,
                        this.camera.position.y - pan.y,
                        this.camera.position.z - pan.z
                        ).normalize();
                this.tinyBrainCam.position.set(pos3.x * 10, pos3.y * 10, pos3.z * 10);
                this.tinyBrainCam.rotation.copy(this.camera.rotation);

                this.brainLight.position.copy(this.tinyBrainCam.position);

                this.brainRenderer.clear();
                this.brainRenderer.render(this.tinyBrainScene, this.tinyBrainCam);
            }
        },
        
        overlay: function(nifti) {
            while (this.visual_weights.length > 0) {
                let weightLayer = this.visual_weights.pop();
                if (weightLayer) this.scene_overlay.remove(weightLayer);
            }
            if (nifti) {
                let raw = nifti.buffer;
                try {
                    raw = pako.inflate(nifti.buffer);
                } catch (exception) {}
                
                let N = niftijs.parse(raw);
                console.log(N);
                console.log(niftijs.parseHeader(raw));
                let data_count = 0;
                let stride = [1, N.sizes[0], N.sizes[0] * N.sizes[1]];
                
                console.log(niftireader.readHeader(raw));
                this.color_map_affine = niftireader.readHeader(raw).affine;
                this.color_map_head = niftijs.parseHeader(raw);
                this.color_map = ndarray(N.data, N.sizes, stride);
                this.selected_nifti = nifti;
                
                this.stats.min = null;
                this.stats.max = null;
                this.stats.sum = 0;
                
                N.data.forEach(v=>{
                    if (!isNaN(v)) {
                        if (this.stats.min == null) this.stats.min = v;
                        if (v < this.stats.min) this.stats.min = v;
                        
                        if (this.stats.max == null) this.stats.max = v;
                        if (v > this.stats.max) this.stats.max = v;
    
                        this.stats.sum += v;
                        data_count++;
                    }
                });
                this.stats.mean = this.stats.sum / data_count;
                
                //compute sdev
                let stddev_sum = 0, d;
                N.data.forEach(v=>{
                    if (!isNaN(v)) {
                        d = v - this.stats.mean;
                        stddev_sum += d * d;
                    }
                });
                
                this.stats.stddev = Math.sqrt(stddev_sum / data_count);
                this.stats.stddev_m5 = this.stats.mean - this.stats.stddev * 1.3;
                this.stats.stddev_5 = this.stats.mean + this.stats.stddev * 1.3;
            }
            else {
                this.color_map = null;
                this.color_map_head = null;
                this.selectedNifti = null;
            }
            
            this.recalculate_materials();
        },
        
        load_surface: function(surface, next_surface) {
            let loader;
            switch (surface.filetype) {
                case 'vtk':
                    loader = vtkLoader;
                    break;
                case 'ply':
                    loader = plyLoader;
                    break;
                case 'stl':
                    loader = stlLoader;
                    break;
                default:
                    throw "Unknown surface type " + surface.filetype;
            }
            loader.load(surface.filename, geometry=>{
                geometry.computeVertexNormals();
                
                this.loaded++;
                this.filename2geometry[surface.basename||surface.filename] = geometry;
                
                let add_surface = surface.visible;
                if (typeof surface.visible != 'boolean') add_surface = true;
                
                if (add_surface) {
                    this.add_surface(surface, geometry);
                }
                
                next_surface();
            });
        },

        add_surface: function(surface, geometry) {
            //var scene = new THREE.Scene();
            //this.scene.add(this.camera);
            
            let material = this.calculate_material(surface, geometry);
            let mesh = new THREE.Mesh(geometry, material);
            
            let name = surface.name.replace("_", " ");
            // let modifier = new THREE.SubdivisionModifier(1);
            // modifier.modify(geometry);
            
            this.meshes.push({surface, mesh, display_name: name});
            
            //scene.add(mesh);
            this.scene.add(mesh);
        },
        
        inflate: function(inflation) {
            this.inflation = inflation;
            this.meshes.forEach(object => {
                if (object.mesh.material.uniforms) {
                    if (object.mesh.material.uniforms.inflation) {
                        object.mesh.material.uniforms.inflation.value = inflation;
                    }
                }
            });
        },
        
        recalculate_materials: function() {
            this.meshes.forEach(obj => {
                let surface_visible = obj.surface.visible;
                if (typeof obj.surface.visible != 'boolean') surface_visible = true;
                
                if (surface_visible) {
                    let morph_target;
                    let surface = obj.surface;
                    if (obj.surface.morphTarget) {
                        morph_target = this.filename2geometry[obj.surface.morphTarget];
                        this.morphing = true;
                    }
                    obj.mesh.material = this.calculate_material(surface, obj.mesh.geometry, morph_target);
                }
            });
        },
        
        calculate_material: function(surface, geometry, inflated_geometry) {
            inflated_geometry = inflated_geometry || geometry;
            
            let vertshader = `
            attribute vec4 color;
            attribute vec3 morphTarget;
            attribute vec3 normalTarget;
            uniform float inflation;
            
            varying vec4 vcolor;
            varying vec3 vpos;
            varying vec3 vnorm;
            varying vec3 vdestnorm;
            
            void main() {
                vec3 morphDifference = morphTarget - position;
                
                vcolor = color;
                vnorm = normalMatrix * normal;
                vdestnorm = normalMatrix * normalTarget;
                vpos = (modelViewMatrix * vec4(position + morphDifference * inflation, 1.0)).xyz;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position + morphDifference * inflation, 1.0);
            }`;
            let fragshader = `
            precision highp float;
            
            uniform float inflation;
            varying vec4 vcolor;
            varying vec3 vpos;
            varying vec3 vnorm;
            varying vec3 vdestnorm;
            
            struct PointLight {
                vec3 color;
                vec3 position;
                float distance;
            };
            uniform PointLight pointLights[NUM_POINT_LIGHTS];
            uniform float lightIntensity;
            
            void main() {
                vec4 illumination = vec4(0.1, 0.1, 0.1, 1.0);
                vec3 norm = clamp(vnorm + (vdestnorm - vnorm) * inflation, 0.0, 1.0);
                
                for (int l = 0; l < NUM_POINT_LIGHTS; l++) {
                    vec3 lightDirection = normalize(vpos - pointLights[l].position);
                    illumination.xyz += clamp(dot(-lightDirection, norm), 0.0, 1.0) * pointLights[l].color;
                }
                gl_FragColor = vcolor * illumination;
            }`;
            let default_color = Math.abs(hashstring(surface.name.replace(/^(Left|Right)|\-rh\-|\-lh\-/g, ""))) % 0xffffff;
            
            let colors = [];
            let morph_targets = [];
            let affine_inv = mathjs.identity([4, 4]);
            if (this.color_map_affine) {
                affine_inv = mathjs.inv(this.color_map_affine);
            }
            
            for (let i = 0; i < geometry.attributes.position.count; i++) {
                // setup morph targets
                morph_targets.push(inflated_geometry.attributes.position.array[i * 3]);
                morph_targets.push(inflated_geometry.attributes.position.array[i * 3 + 1]);
                morph_targets.push(inflated_geometry.attributes.position.array[i * 3 + 2]);
                
                // assign color
                if (this.color_map) {
                    let overlay_xyzw = mathjs.multiply(affine_inv, [
                        [geometry.attributes.position.array[i * 3]],
                        [geometry.attributes.position.array[i * 3 + 1]],
                        [geometry.attributes.position.array[i * 3 + 2]],
                        [1]]);
                    
                    let ov_x = overlay_xyzw[0][0];
                    let ov_y = overlay_xyzw[1][0];
                    let ov_z = overlay_xyzw[2][0];
                    
                    let weight = this.color_map.get(Math.round(ov_x), Math.round(ov_y), Math.round(ov_z));
                    
                    if (!isNaN(weight)
                        && ov_x >= 0 && ov_x < this.color_map.shape[0]
                        && ov_y >= 0 && ov_y < this.color_map.shape[1]
                        && ov_z >= 0 && ov_z < this.color_map.shape[2]) {
                        let rgb = this.weight2heat(weight);
                        colors.push(rgb[0]);
                        colors.push(rgb[1]);
                        colors.push(rgb[2]);
                        colors.push(1);
                    } else {
                        colors.push(.5);
                        colors.push(.5);
                        colors.push(.5);
                        colors.push(1);
                    }
                } else if (surface.vcolor && surface.vcolor[i]) {
                    colors.push(((surface.vcolor[i] >> 16) & 255) / 256);
                    colors.push(((surface.vcolor[i] >> 8) & 255) / 256);
                    colors.push((surface.vcolor[i] & 255) / 256);
                    colors.push(1);
                } else {
                    colors.push(((default_color >> 16) & 255) / 256);
                    colors.push(((default_color >> 8) & 255) / 256);
                    colors.push((default_color & 255) / 256);
                    colors.push(1);
                }
            }
            
            geometry.addAttribute('normalTarget', new THREE.BufferAttribute(inflated_geometry.attributes.normal.array.slice(), 3));
            geometry.addAttribute('morphTarget', new THREE.BufferAttribute(new Float32Array(morph_targets), 3));
            
            geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));
            
            return new THREE.ShaderMaterial({
                // color: type == 'l' ? new THREE.Color(0x2194ce) : new THREE.Color(0xce2194),
                vertexShader: vertshader,
                fragmentShader: fragshader,
                transparent: true,
                lights: true,
                uniforms: THREE.UniformsUtils.merge([
                    THREE.UniformsLib['lights'], {
                        inflation: { value: this.inflation },
                        lightIntensity: { value: 1 },
                    }
                ]),
            })
        },
        
        weight2heat: function(weight) {
            let r = 0, g = 0, b = 0;
            
            if (weight < 1/3) {
                r = weight * 3;
            } else if (weight < 2/3) {
                r = 1;
                g = (weight - 1/3) * 3;
            } else {
                r = 1;
                g = 1;
                b = (weight - 2/3) * 3;
                if (b > 1) b = 1;
            }
            
            return [r, g, b];
        },

        toggle_rotate: function() {
            this.controls.autoRotate = !this.controls.autoRotate;
        },
        
        updateBackground: function() {
            let newGray = Math.pow(0x33 / 0xff, 1 / this.gamma);
            this.scene.background = new THREE.Color(newGray, newGray, newGray);
        },
    }
});

function getHashValue(key) {
    var matches = location.hash.match(new RegExp(key+'=([^&]*)'));
    return matches ? decodeURIComponent(matches[1]) : null;
}

function hashstring(s) {
    var h = 0, l = s.length, i = 0;
    if ( l > 0 )
        while (i < l)
            h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
}

})();