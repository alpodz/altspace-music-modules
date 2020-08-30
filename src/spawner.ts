/*!
 * Licensed under the MIT License.
 */

import * as MRE from '../../mixed-reality-extension-sdk/packages/sdk/';
//import * as MRE from '../../mixed-reality-extension-sdk/packages/sdk/';
import App from './app';
import SpawnerGUI from './spawner_gui';
import WavPlayer from './wavplayer';

interface BubbleProperties{
	timeStamp: number;
	actor: MRE.Actor;
	note: number;
}

export default class Spawner {

	/**************
  	 https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=12
	****************/
	/*
	A6CEE3
	1F78B4
	B2DF8A
	33A02C
	FB9A99
	E31A1C
	FDBF6F
	FF7F00
	CAB2D6
	6A3D9A
	FFFF99
	B15928
	*/
	
	private noteColors: MRE.Color4[] = [
		new MRE.Color4(166 / 255, 206 / 255, 227 / 255),
		new MRE.Color4(31 / 255, 120 / 255, 180 / 255),
		new MRE.Color4(178 / 255, 223 / 255, 138 / 255),
		new MRE.Color4(51 / 255, 160 / 255, 44 / 255),
		new MRE.Color4(251 / 255, 154 / 255, 153 / 255),
		new MRE.Color4(227 / 255, 26 / 255, 28 / 255),
		new MRE.Color4(253 / 255, 191 / 255, 111 / 255),
		new MRE.Color4(255 / 255, 127 / 255, 0 / 255),
		new MRE.Color4(202 / 255, 178 / 255, 214 / 255),
		new MRE.Color4(106 / 255, 61 / 255, 154 / 255),
		new MRE.Color4(255 / 255, 255 / 255, 153 / 255),
		new MRE.Color4(177 / 255, 89 / 255, 40 / 255)];

	private particleEffects: string [] = [
		"artifact:1502544138917118217",
		"artifact:1502544125159801091",
		"artifact:1502544152556994829",
		"artifact:1502544200791490851",
		"artifact:1502544158974279955",
		"artifact:1502544131971350791",
		"artifact:1502544211017204009",
		"artifact:1502544145477009675",
		"artifact:1502544192268665119",
		"artifact:1502544182571434268",
		"artifact:1502544165660000535",
		"artifact:1502544173000032538"
	]

	private sphereMesh: MRE.Mesh;
	private boxMesh: MRE.Mesh;

	public availableBubbles: BubbleProperties[]=[]; 

	private noteMaterials: MRE.Material[] = [];
	public spawnerWidth=0.5;
	public spawnerHeight=0.2;
	private ourSpawner: MRE.Actor;
	private spawnerActor: MRE.Actor;

	private bubbleLimit=50;

	public timeOut=10.0;
	public bubbleSize=0.05;
	public bubbleSpeed=0.1;
	public doParticleEffect=false;
	public doPosRandom=true;
	public noFreezeRotation=true;
	public audioRange=10;
	public ourWavPlayer: WavPlayer;
	
	public setEmitterWidth(n: number): void {
		this.spawnerWidth=n;
		this.spawnerActor.transform.local.scale=new MRE.Vector3(this.spawnerWidth, 0.01, 0.05);
	}
	public setEmitterHeight(n: number): void {
		this.spawnerHeight=n;
	}

	public setTimeOut(n: number): void {
		this.timeOut=n;
	}

	public setBubbleSize(n: number): void {
		this.bubbleSize=n;
	}

	public setBubbleSpeed(n: number): void {
		this.bubbleSpeed=n;
	}

	public setAudioRange(n: number): void {
		this.audioRange=n;
	}

	public setDoParticleEffect(b: boolean): void {
		this.doParticleEffect=b;
	}

	public setDoPosRandom(b: boolean): void {
		this.doPosRandom=b;
	}

	public setNoFreezeRotation(b: boolean): void {
		this.noFreezeRotation=b;
	}

	private ourSpawnerGUI: SpawnerGUI=null;

	private removeFromAvailable(ourBubble: BubbleProperties) {
		const index = this.availableBubbles.indexOf(ourBubble);
		if (index > -1) {
			this.availableBubbles.splice(index, 1);
		}
	}	

	constructor(private ourApp: App) {

		setInterval(() => { //cull bubbles that have been around too long
			const currentTime = Date.now();
			const listOfAvailableBubblesToDelete: BubbleProperties[]=[];

			for (const ourBubble of this.availableBubbles) {
				if (currentTime - ourBubble.timeStamp > (this.timeOut*1000)) {
					ourBubble.actor.destroy();
					listOfAvailableBubblesToDelete.push(ourBubble);
				}
			}		
			
			for(const ourBubble of listOfAvailableBubblesToDelete){
				this.removeFromAvailable(ourBubble);
			}		
	
			//const timeNow=new Date(Date.now());			

			/*this.ourApp.ourConsole.logMessage(
				`Time: ${this.ourApp.pad(timeNow.getHours(),2,'0')}:`+
				`${this.ourApp.pad(timeNow.getMinutes(),2,'0')}:` +
				`${this.ourApp.pad(timeNow.getSeconds(),2,'0')} - ` +
				`${this.availableBubbles.length} playable `+
				`(${listOfAvailableBubblesToDelete.length} culled)`);*/
		}, 1000);
	}

	public async createAsyncItems(pos: MRE.Vector3) {
		this.boxMesh = this.ourApp.assets.createBoxMesh('boxMesh', 1.0, 1.0, 1.0);
		await this.boxMesh.created;

		this.ourSpawner = MRE.Actor.Create(this.ourApp.context, {
			actor: {
				name: 'spawner',
				transform: {
					app: { position: pos },
				}
			}
		});

		await this.ourSpawner.created();

		this.ourSpawner.setCollider(MRE.ColliderType.Box, false, {x: this.spawnerWidth, y: 0.01, z: 0.05});

		//adding rigidbody leads to incorrect behavior. perhaps grabbable=true instantiates rigidbody?
		/*this.ourSpawner.enableRigidBody({
			enabled: true,
			isKinematic: true,
			useGravity: false
		});*/

		this.ourSpawner.grabbable = true; //so we can move it around
		this.ourSpawner.subscribe('transform'); //so we can get pos updates

		this.spawnerActor=MRE.Actor.Create(this.ourApp.context, {
			actor: {
				name: 'spawner',
				parentId: this.ourSpawner.id,
				transform: {
					local: {
						scale: new MRE.Vector3(this.spawnerWidth, 0.01, 0.05)
					}
				},
				appearance:
				{
					meshId: this.boxMesh.id
				}
			}
		});
		await this.spawnerActor.created();

		for (const noteColor of this.noteColors) {
			const ourMat: MRE.Material = this.ourApp.assets.createMaterial('bubblemat', {
				color: noteColor
				//mainTextureId: this.sphereTexture.id
			});
			await ourMat.created;
			this.noteMaterials.push(ourMat);
		}
		this.ourApp.ourConsole.logMessage("completed all spawner object creation");

		this.ourSpawnerGUI=new SpawnerGUI(this.ourApp, this);
		const guiPos=new MRE.Vector3(pos.x-2,0,pos.z);
		await this.ourSpawnerGUI.createAsync(guiPos);

	}

	private createBubble(pos: MRE.Vector3, rot: MRE.Quaternion, scale: number,
		vel: MRE.Vector3, mat: MRE.Material): BubbleProperties {
		
		let constraints=[MRE.RigidBodyConstraints.None];

		if(!this.noFreezeRotation){
			constraints=[MRE.RigidBodyConstraints.FreezeRotation];
		}

		const bubbleActor = MRE.Actor.Create(this.ourApp.context, {
			actor: {
				name: 'sphere',
				parentId: this.ourSpawner.id,
				transform: {
					local: {
						position: pos,
						rotation: rot,
						scale: new MRE.Vector3(scale, scale, scale)
					}
				},
				appearance: {
					meshId: this.boxMesh.id,
					materialId: mat.id
				},
				collider: {
					geometry: {
						shape: MRE.ColliderType.Box
					},
					isTrigger: false
				},
				rigidBody: {
					useGravity: false,
					velocity: vel,
					constraints: constraints
				},
				subscriptions: ['transform'],
			}
		});		

		const ourBubble={
			timeStamp: Date.now(),
			actor: bubbleActor,
			note: 0
		};

		this.availableBubbles.push(ourBubble);

		return ourBubble;
	}

	private spawnParticleEffect(pos: MRE.Vector3, colorIndex: number) {
		if(!this.doParticleEffect){
			return;
		}
		const particleScale=this.bubbleSize*2.0;

		//this.ourApp.ourConsole.logMessage("creating particle at: " + pos);
		const particleActor = MRE.Actor.CreateFromLibrary(this.ourApp.context, {
			resourceId: this.particleEffects[colorIndex],
			actor: {
				name: 'particle burst',
				transform: {
					app: {
						position: pos
					},
					local: {
						scale: { x: particleScale, y: particleScale, z: particleScale }
					}
				}
			}
		});
		setTimeout(() => {
			this.ourApp.ourConsole.logMessage("3 seconds has expired. deleting particle effect");
			particleActor.destroy();
		}, 3000);
	}

	private mapRange(input: number, inputLow: number, inputHigh: number, outputLow: number, outputHigh: number) {
		const inputRange = inputHigh - inputLow;
		const inputPercent = (input - inputLow) / inputRange;
		const outputRange = outputHigh - outputLow;
		const output = outputLow + inputPercent * outputRange;

		return output;
	}

	public spawnBubble(note: number, vel: number) {
		this.ourApp.ourConsole.logMessage("trying to spawn bubble for: " + note);
		const octave = Math.floor(note / 12);
		const noteNum = note % 12;
		const scale = this.bubbleSize; //0.05; //this.mapRange(note,21,108,1.0,0.1) * 0.04;
		const speed = this.bubbleSpeed; //0.1; //this.mapRange(note,21,108,0.1,1.0) * -0.5;

		while(this.availableBubbles.length>this.bubbleLimit){
			this.ourApp.ourConsole.logMessage("culling bubble. enforcing bubble limit of: " + this.bubbleLimit);
			const bubbleToCull=this.availableBubbles.shift();
			bubbleToCull.actor.destroy();
		}

		let spawnPos= new MRE.Vector3(0,0,0);

		if (this.doPosRandom) {
			spawnPos = new MRE.Vector3(
				Math.random() * this.spawnerWidth - this.spawnerWidth * 0.5,
				(scale * 2.0) + Math.random() * this.spawnerHeight,
				0.0);
		} else {
			spawnPos = new MRE.Vector3(
				this.spawnerWidth * (noteNum / 11) - this.spawnerWidth * 0.5,
				(scale * 2.0) + (octave - 1) / 8 * this.spawnerHeight,
				0.0);
		}

		const spawnRot =
			MRE.Quaternion.FromEulerAngles(Math.random() * 360, Math.random() * 360, Math.random() * 360);

		const spawnerRot = this.ourSpawner.transform.app.rotation;
		const forVec = new MRE.Vector3(0, 0, 1);
		const spawnForVec = new MRE.Vector3(0, 0, 0);
		forVec.rotateByQuaternionToRef(spawnerRot, spawnForVec);
		const velocityVec = spawnForVec.multiplyByFloats(-speed, -speed, -speed);

		const ourBubble = this.createBubble(spawnPos, spawnRot, scale, velocityVec, this.noteMaterials[noteNum]);
		ourBubble.note=note;

		ourBubble.actor.collider.onCollision("collision-enter", (data: MRE.CollisionData) => {
			const otherActor = data.otherActor;


			if (otherActor.name.includes('SpawnerUserHand')) { //bubble touches hand
				//const impulseVec: MRE.Vector3=data.impulse;
				//const impMag=MRE.Vector3.Distance(MRE.Vector3.Zero(),impulseVec); //not sure why length() doesn't work
				//this.ourApp.ourConsole.logMessage("impulse of collision: " + impMag);	
				
				const collisionPos=data.contacts[0].point; //ourBubble.actor.transform.app.position

				//this.ourWavPlayer.playSound(note,127,collisionPos);
				this.spawnParticleEffect(collisionPos, noteNum);
				//this.ourApp.ourSender.send(`["/NoteOn",${ourBubble.note}]`);
				
				this.removeFromAvailable(ourBubble);
				ourBubble.actor.destroy();
				this.ourApp.ourConsole.logMessage("bubble popped for note: " + note);		
			} else {
				//this.ourApp.ourConsole.logMessage("sphere collided with: " + otherActor.name);
			}
		});
	}
}
