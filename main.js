'use strict';

(async _ => {
//

let debounceUrl, debounceGamma;

let vtkLoader = new THREE.VTKLoader();
let plyLoader = new THREE.PLYLoader();
let stlLoader = new THREE.STLLoader();
let config = window.config || window.parent.config;

if (!config) {
    config = {};
    config.debug = true;
    let debugSurfaces = await fetch('debug-surfaces.json');
    config.surfaces = await debugSurfaces.json();
    config.surfaces.forEach(surface => {
        surface.filename = "freesurfer/surfaces/" + surface.filename;
    });
}

Vue.component("controller", {
    props: [ "meshes", "visible" ],
    data: function() {
        return {
            rotate: false,
            para3d: false,
            all: true,
            
            niftis: [],
            selectedNifti: null,
            gamma: 1,
            
            sortedMeshes: []
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
        selectedNifti: function(nifti) {
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
                this.selectedNifti = this.niftis.length - 1;
            });
            reader.readAsArrayBuffer(file);
        },
    },
    
    template: `
        <div :class="{ 'controls': true, 'visible': visible }">
            <div class="control">
                <input type="checkbox" v-model="rotate"></input> Rotate</input>
                <input type="checkbox" v-model="para3d"></input> 3D</input>
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
                    <select v-model="selectedNifti">
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
            <controller v-if="controls" :meshes="meshes" :visible="controlsVisible" @rotate="toggle_rotate()" id="controller" @para3d="set_para3d" @gamma="set_gamma" @overlay="overlay" />
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
            color_map_head: null,
            gamma: 1,
            
            //loaded meshes
            meshes: [],
            visual_weights: [],
            
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
            })
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
                this.renderer.render( this.scene_overlay, this.camera );
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
                let data_count = 0;
                let stride = [1, N.sizes[0], N.sizes[0] * N.sizes[1]];
                
                this.color_map_head = niftijs.parseHeader(raw);
                this.color_map = ndarray(N.data, N.sizes, stride);
                this.selectedNifti = nifti;
                
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
                
                this.show_nifti(N.data);
            }
            else {
                this.color_map = null;
                this.color_map_head = null;
                this.selectedNifti = null;
            }
            
            this.meshes.forEach(object => {
                let mesh = object.mesh;
                let material = this.calculate_material(object.surface, mesh.geometry);
                mesh.material = material;
            });
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
                this.loaded++;
                this.add_surface(surface, geometry);
                next_surface();
            });
        },

        add_surface: function(surface, geometry) {
            //var scene = new THREE.Scene();
            //this.scene.add(this.camera);
            
            geometry.computeVertexNormals();
            
            let material = this.calculate_material(surface, geometry);
            let mesh = new THREE.Mesh(geometry, material);
            
            let name = surface.name.replace("_", " ");
            // let modifier = new THREE.SubdivisionModifier(1);
            // modifier.modify(geometry);
            
            this.meshes.push({surface, mesh, display_name: name});
            
            //scene.add(mesh);
            this.scene.add(mesh);
        },
        
        computeVerticesAndFaces: function(geometry) {
            if (geometry.attributes && geometry.attributes.position) {
                geometry.vertices = [];
                geometry.faces = [];
                for (let i = 0; i < geometry.attributes.position.count; i += 3) {
                    geometry.vertices.push(new THREE.Vector3(
                        geometry.attributes.position[i],
                        geometry.attributes.position[i + 1],
                        geometry.attributes.position[i + 2]
                    ));
                }
                for (let i = 0; i < geometry.vertices.length - 1; i += 3) {
                    geometry.faces.push(new THREE.Face3(
                        i,
                        i + 1,
                        i + 2
                    ));
                }
            }
        },
        
        calculate_material: function(surface, geometry) {
            let colorValue = Math.abs(hashstring(surface.name.replace(/^(Left|Right)|\-rh\-|\-lh\-/g, ""))) % 0xffffff;
            
            let material = new THREE.MeshPhongMaterial({color: colorValue});
            if (this.color_map) {
                material.transparent = true;
                material.opacity = .5;
            }
            return material;
        },
        
        show_nifti: function(data) {
            if (this.color_map) {
                let buckets = [];
                let num_buckets = 16;
                let threshold = 0;
                
                for (let i = 0; i < num_buckets; i++) {
                    buckets.push(new THREE.Geometry());
                }
                
                for (let x = 0; x < this.color_map.shape[0]; x++) {
                    for (let y = 0; y <= this.color_map.shape[1]; y++) {
                        //for (let z = 0; z < this.color_map.shape[0]; z++) {
                        for (let z = 22; z <= 22; z++) {
                            //let value = this.color_map.get(z, y, x);
                            let value = this.color_map.get(y, this.color_map.shape[0] - x, z);

                            if(value > 10) value = 0; //consider to be noise for now..
                            if(isNaN(value)) value = 0;
                            let normalized_value = value / 1;
                            
                            if (value > threshold) {
                                let tx = (x / this.color_map.shape[0] * 256 - 128) / 1.5;
                                let ty = (y / this.color_map.shape[1] * 256 - 128) / 1.5;
                                let tz = (z / this.color_map.shape[2] * 256 - 128) / 1.5;
                                
                                let bucket = Math.round(normalized_value * num_buckets);
                                if(bucket >= num_buckets) bucket = num_buckets-1; //overflow
                                
                                buckets[bucket].vertices.push(new THREE.Vector3(tx, ty, tz));
                            }
                            
                        }
                    }
                }
                
                //this.visual_weights = [];
                for (let bucket = 0; bucket < num_buckets; bucket++) {
                    let material = new THREE.PointsMaterial({
                        transparent: true,
                        size: 6,
                        opacity: bucket/num_buckets,
                    });
                    this.visual_weights[bucket] = new THREE.Points(buckets[bucket], material);
                    this.scene_overlay.add(this.visual_weights[bucket]);
                }
            }
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