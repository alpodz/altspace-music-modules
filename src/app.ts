/*!
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
//import * as MRE from '../../mixed-reality-extension-sdk/packages/sdk/';

import { PianoReceiver, RCallback } from './receiver'
import Piano from './piano'
//import Spawner from './spawner'
import OscSender from './sender';
import WavPlayer from './wavplayer';
import Console from './console';
import Button from './button';
import Staff from './staff';
import GrabButton from './grabbutton';
import PianoGui from './piano_gui';
import StaffGui from './staff_gui';
import WavPlayerGui from './wavplayer_gui';
import Users from './users';
import Tablature from './tablature';
import GuiPanel from './gui_panel';
import MusicModule from './music_module';
import Sequencer from './sequencer';
import SequencerGui from './sequencer_gui';
import PatchPoint from './patch_point';
import Patcher from './patcher';
import HeartBeat from './heartbeat';
import HeartBeatGui from './heartbeat_gui';

export default class App {
	public assets: MRE.AssetContainer;

	public ourPatcher: Patcher = null;
	public ourPiano: Piano = null;
	public ourPianoGui: PianoGui = null;

	public ourStaff: Staff = null;
	public ourStaffGui: StaffGui = null;

	public ourTablature: Tablature=null;

	public ourHeartBeat: HeartBeat=null;
	public ourHeartBeatGui: HeartBeatGui=null;

	public ourWavPlayer: WavPlayer = null;
	public ourWavPlayerGui: WavPlayerGui = null;

	public ourSequencer: Sequencer = null;
	public ourSequencerGui: SequencerGui = null;

	public showGUIs=true;
	public showGrabbers=true;

	public allGUIs: GuiPanel[] = [];
	public allModules: MusicModule[]=[];

	//public ourPiano2: Piano = null;
	//public ourStaff2: Staff=null;

	public ourSpawner: any = null;
	public ourSpawner2: any = null;


	public ourWavPlayer2: WavPlayer = null;
	public ourConsole: Console = null;
	public menuGrabber: GrabButton = null;
	public showGUIsButton: Button = null;
	public showGrabbersButton: Button = null;

	public boxMesh: MRE.Mesh;
	public sphereMesh: MRE.Mesh;
	
	public redMat: MRE.Material;
	public greenMat: MRE.Material;
	public whiteMat: MRE.Material;
	public blackMat: MRE.Material;
	public grayMat: MRE.Material;
	public darkgrayMat: MRE.Material;
	public grayRedMat: MRE.Material;
	public lightgrayMat: MRE.Material;

	public handMesh: MRE.Mesh = null;
	public handTexture: MRE.Texture = null;
	public handMaterial: MRE.Material = null;

	public ourUsers: Users;

	private receiverCallback: RCallback;

	constructor(public context: MRE.Context, public baseUrl: string, public baseDir: string,
		public ourReceiver: PianoReceiver, public ourSender: OscSender) {
		this.ourConsole = new Console(this);
		this.ourPatcher = new Patcher(this);
		this.ourUsers=new Users(this);

		this.assets = new MRE.AssetContainer(context);		

		this.context.onUserLeft(user => this.ourUsers.userLeft(user));
		this.context.onUserJoined(user => {
			this.ourUsers.userJoined(user)
		});

		this.context.onStarted(() => this.started());
		this.context.onStopped(() => this.stopped());
	}

	private createMeshAndMaterial(){
		this.boxMesh = this.assets.createBoxMesh('boxMesh', 1.0, 1.0, 1.0);
		this.sphereMesh= this.assets.createSphereMesh('sphereMesh',0.5,10,10);

		this.redMat = this.assets.createMaterial('redmat', {
			color: new MRE.Color4(1, 0, 0)
		});

		this.greenMat = this.assets.createMaterial('greenMat', {
			color: new MRE.Color4(0, 1, 0)
		});
		this.blackMat = this.assets.createMaterial('blackMat', {
			color: new MRE.Color4(0, 0, 0)
		});
		this.whiteMat = this.assets.createMaterial('whiteMat', {
			color: new MRE.Color4(1, 1, 1)
		});
		this.grayMat = this.assets.createMaterial('grayMat', {
			color: new MRE.Color4(0.5, 0.5, 0.5)
		});
		this.grayRedMat = this.assets.createMaterial('grayMat', {
			color: new MRE.Color4(0.5, 0.25, 0.25)
		});
		this.lightgrayMat = this.assets.createMaterial('lightgrayMat', {
			color: new MRE.Color4(0.75, 0.75, 0.75)
		});
		this.darkgrayMat = this.assets.createMaterial('lightgrayMat', {
			color: new MRE.Color4(0.25, 0.25, 0.25)
		});

		const filename = `${this.baseUrl}/` + "hand_grey.png";
		this.handTexture = this.assets.createTexture("hand", {
			uri: filename
		});

		this.handMaterial = this.assets.createMaterial('handMat', {
			color: new MRE.Color4(1, 1, 1),
			mainTextureId: this.handTexture.id
		});

		this.handMesh = this.assets.createBoxMesh('boxMesh', 0.25, 0.1, 0.25);
	}

	//TODO: move this to midiReceive module
	private PianoReceiveCallback(note: number, vel: number, channel: number): void {
		this.ourConsole.logMessage(`App received - note: ${note} vel: ${vel}`);

		if (vel > 0) {
			//if(this.ourWavPlayer){
			//	this.ourWavPlayer.playSound(note,127,new MRE.Vector3(0,0,0), 20.0);
			//}
			if (this.ourPiano) {
				this.ourPiano.keyPressed(note, vel);
			}
			if (this.ourSpawner) {
				this.ourSpawner.spawnBubble(note, vel);
			}
			if (this.ourSpawner2) {
				this.ourSpawner2.spawnBubble(note, vel);
			}
			//if (this.ourStaff) {
			//	this.ourStaff.receiveNote(note, vel);
			//}
			if(this.ourTablature){
				this.ourTablature.receiveNote(note,vel,channel);
			}
		} else {
			//this.ourPiano.stopSound(note);
			if (this.ourPiano) {
				this.ourPiano.keyReleased(note);
			}
		}
	}	

	public degToRad(degrees: number) {
		const pi = Math.PI;
		return degrees * (pi / 180);
	}
	private doReset() {
		process.exit(0);
	}

	public vector2String(v: MRE.Vector3, precision: number) {
		return "{X: " + v.x.toFixed(precision) +
			" Y: " + v.y.toFixed(precision) +
			" Z: " + v.z.toFixed(precision) + "}";
	}

	/*
		https://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript	
	*/
	public pad(value: number, maxWidth: number, padChar: string) {
		const n = value.toString();
		return n.length >= maxWidth ? n : new Array(maxWidth - n.length + 1).join(padChar) + n;
	}

	public showAllGuis(b: boolean) {
		if (b) {
			this.ourConsole.logMessage("trying to show all GUIs");
		} else {
			this.ourConsole.logMessage("trying to hide all GUIs");
		}
		for (const singlePanel of this.allGUIs) {
			if (b) {
				singlePanel.show();

			} else {
				singlePanel.hide();
			}
		}

		if (b) {
			this.ourPatcher.showPatchLines();
		} else {
			this.ourPatcher.hidePatchLines();
		}
	}

	public showAllGrabbers(b: boolean) {
		if (b) {
			this.ourConsole.logMessage("trying to show all grabbers");
			this.menuGrabber.showOnlyGrabber();
		} else {
			this.ourConsole.logMessage("trying to hide all grabbers");
			this.menuGrabber.hideOnlyGrabber();
		}

		for (const singlePanel of this.allGUIs) {
			if (b) {
				singlePanel.showGrabber();

			} else {
				singlePanel.hideGrabber();
			}
		}

		for (const singleModule of this.allModules) {
			if (b) {
				singleModule.showGrabber();

			} else {
				singleModule.hideGrabber();
			}
		}
	}

	private async loadAsyncItems() {
		this.ourConsole.logMessage("creating console");
		await this.ourConsole.createAsyncItems(new MRE.Vector3(-0.7, 0, 0.9),this.menuGrabber.getGUID());

		let buttonZPos=0.5;

		this.ourConsole.logMessage("Creating Reset Button ");
		const button = new Button(this);
		await button.createAsync(new MRE.Vector3(-0.7, 0, buttonZPos), this.menuGrabber.getGUID(), "Reset", "Reset",
			false, this.doReset.bind(this));
		buttonZPos -= 0.4;

		this.ourConsole.logMessage("Creating ShowGUI Button ");
		this.showGUIsButton = new Button(this);
		await this.showGUIsButton.createAsync(new MRE.Vector3(-0.7, 0, buttonZPos),
			this.menuGrabber.getGUID(), "GUIs ON", "GUIs OFF",
			this.showGUIs, this.showAllGuis.bind(this));
		buttonZPos -= 0.2;

		this.ourConsole.logMessage("Creating ShowGUI Button ");
		this.showGrabbersButton = new Button(this);
		await this.showGrabbersButton.createAsync(new MRE.Vector3(-0.7, 0, buttonZPos),
			this.menuGrabber.getGUID(), "Grabbers ON", "Grabbers OFF",
			this.showGrabbers, this.showAllGrabbers.bind(this));
		buttonZPos -= 0.2;

		//await this.showPianoStaff();
		await this.showSequencerPiano();

		this.ourConsole.logMessage("Waiting for all patch lines to be created");

		for(const singlePatch of this.ourPatcher.ourPatches){
			await singlePatch.line.created();
		}

		this.showGUIsButton.setValue(false);
		this.showGrabbersButton.setValue(false);

		this.ourConsole.logMessage("Finished creation of all asyn items");

	}

	private async showPianoStaff(){
		let xPos = 1.5;

		this.ourConsole.logMessage("Creating Wav Player");
		this.ourWavPlayer = new WavPlayer(this);
		await this.ourWavPlayer.loadAllSounds("piano");
		this.allModules.push(this.ourWavPlayer);

		this.ourWavPlayerGui = new WavPlayerGui(this, this.ourWavPlayer);
		await this.ourWavPlayerGui.createAsync(new MRE.Vector3(xPos, 0.1, 0), "Piano WavPlayer")		
		this.allGUIs.push(this.ourWavPlayerGui);
		xPos -= 1.75;

		this.ourConsole.logMessage("creating piano keys");
		this.ourPiano = new Piano(this);
		await this.ourPiano.createAllKeys(new MRE.Vector3(2, 1, 0),
			MRE.Quaternion.FromEulerAngles(-30 * Math.PI / 180, 0, 0));	
		this.allModules.push(this.ourPiano);

		this.ourConsole.logMessage("Loading staff items");
		this.ourStaff = new Staff(this);
		await this.ourStaff.createAsyncItems(new MRE.Vector3(2, 2, 0.5),
			MRE.Quaternion.FromEulerAngles(-90 * Math.PI / 180, 0, 0));		
		this.allModules.push(this.ourStaff);	

		this.ourStaffGui = new StaffGui(this, this.ourStaff);
		await this.ourStaffGui.createAsync(new MRE.Vector3(xPos, 0.1, 0), "Staff")
		this.allGUIs.push(this.ourStaffGui);
		xPos -= 1.75;

		this.ourPianoGui = new PianoGui(this, this.ourPiano);
		await this.ourPianoGui.createAsync(new MRE.Vector3(xPos, 0.1, 0), "Piano")
		this.allGUIs.push(this.ourPianoGui);
		this.ourPianoGui.removeSharpsButton();

		const sendPatchPiano = new PatchPoint();
		sendPatchPiano.module = this.ourPiano;
		sendPatchPiano.messageType = "midi";
		sendPatchPiano.isSender = true;
		sendPatchPiano.gui = this.ourPianoGui;
		sendPatchPiano.button = this.ourPianoGui.sendButton;

		const receivePatchStaff = new PatchPoint();
		receivePatchStaff.module = this.ourStaff;
		receivePatchStaff.messageType = "midi";
		receivePatchStaff.isSender = false;
		receivePatchStaff.gui = this.ourStaffGui;
		receivePatchStaff.button = this.ourStaffGui.receiveButton;

		this.ourPatcher.applyPatch(sendPatchPiano, receivePatchStaff);

		const receiveWavPlayer = new PatchPoint();
		receiveWavPlayer.module = this.ourWavPlayer;
		receiveWavPlayer.messageType = "midi";
		receiveWavPlayer.isSender = false;
		receiveWavPlayer.gui = this.ourWavPlayerGui;
		receiveWavPlayer.button = this.ourWavPlayerGui.receiveButton;

		this.ourPatcher.applyPatch(sendPatchPiano, receiveWavPlayer);

		const sendPatchStaff = new PatchPoint();
		sendPatchStaff.module = this.ourStaff;
		sendPatchStaff.messageType = "midi";
		sendPatchStaff.isSender = true;
		sendPatchStaff.gui = this.ourStaffGui;
		sendPatchStaff.button = this.ourStaffGui.sendButton;

		this.ourPatcher.applyPatch(sendPatchStaff, receiveWavPlayer);
	}

	private async showSequencerPiano(){
		let xPos = 1.5;

		this.ourConsole.logMessage("Creating Wav Player");
		this.ourWavPlayer = new WavPlayer(this);
		await this.ourWavPlayer.loadAllSounds("piano");
		this.allModules.push(this.ourWavPlayer);

		this.ourWavPlayerGui = new WavPlayerGui(this, this.ourWavPlayer);
		await this.ourWavPlayerGui.createAsync(new MRE.Vector3(xPos, 0.1, 0), "Piano WavPlayer")		
		this.allGUIs.push(this.ourWavPlayerGui);
		xPos -= 1.75;

		this.ourConsole.logMessage("creating piano keys");
		this.ourPiano = new Piano(this);
		await this.ourPiano.createAllKeys(new MRE.Vector3(2, 1, 0),
			MRE.Quaternion.FromEulerAngles(-30 * Math.PI / 180, 0, 0));	
		this.allModules.push(this.ourPiano);

		this.ourPianoGui = new PianoGui(this, this.ourPiano);
		await this.ourPianoGui.createAsync(new MRE.Vector3(xPos, 0.1, 0), "Piano")
		this.allGUIs.push(this.ourPianoGui);
		this.ourPianoGui.removeSharpsButton();
		xPos -= 1.75;

		const sendPatchPiano = new PatchPoint();
		sendPatchPiano.module = this.ourPiano;
		sendPatchPiano.messageType = "midi";
		sendPatchPiano.isSender = true;
		sendPatchPiano.gui = this.ourPianoGui;
		sendPatchPiano.button = this.ourPianoGui.sendButton;
		
		const receiveWavPlayer = new PatchPoint();
		receiveWavPlayer.module = this.ourWavPlayer;
		receiveWavPlayer.messageType = "midi";
		receiveWavPlayer.isSender = false;
		receiveWavPlayer.gui = this.ourWavPlayerGui;
		receiveWavPlayer.button = this.ourWavPlayerGui.receiveButton;

		this.ourPatcher.applyPatch(sendPatchPiano, receiveWavPlayer);		

		this.ourSequencer = new Sequencer(this);
		await this.ourSequencer.createAsyncItems(new MRE.Vector3(-2, 2.0, 0.0),
			MRE.Quaternion.FromEulerAngles(-45 * Math.PI / 180, 0, 0));

		this.ourSequencerGui = new SequencerGui(this, this.ourSequencer);
		await this.ourSequencerGui.createAsync(new MRE.Vector3(xPos, 0.1, 0), "Sequencer")
		this.allGUIs.push(this.ourSequencerGui);

		xPos =1.5;

		const sendPatchSequencer = new PatchPoint();
		sendPatchSequencer.module = this.ourSequencer;
		sendPatchSequencer.messageType = "midi";
		sendPatchSequencer.isSender = true;
		sendPatchSequencer.gui = this.ourSequencerGui;
		sendPatchSequencer.button = this.ourSequencerGui.sendButton;

		const receivePatchPiano = new PatchPoint();
		receivePatchPiano.module = this.ourPiano;
		receivePatchPiano.messageType = "midi";
		receivePatchPiano.isSender = false;
		receivePatchPiano.gui = this.ourPianoGui;
		receivePatchPiano.button = this.ourPianoGui.receiveButton;

		this.ourPatcher.applyPatch(sendPatchSequencer,receivePatchPiano);		

		this.ourHeartBeat= new HeartBeat(this);
		/*await this.ourHeartBeat.createAsyncItems(new MRE.Vector3(0, 3.0, 0.0),
			MRE.Quaternion.FromEulerAngles(-45 * Math.PI / 180, 0, 0));*/

		this.ourHeartBeatGui = new HeartBeatGui(this, this.ourHeartBeat);
		await this.ourHeartBeatGui.createAsync(new MRE.Vector3(xPos, 0.1, -1.75), "Heart Beat")
		this.allGUIs.push(this.ourHeartBeatGui);

		const sendHeartBeat = new PatchPoint();
		sendHeartBeat.module = this.ourHeartBeat;
		sendHeartBeat.messageType = "heartbeat";
		sendHeartBeat.isSender = true;
		sendHeartBeat.gui = this.ourHeartBeatGui;
		sendHeartBeat.button = this.ourHeartBeatGui.sendButton;

		const receiveSequencerHeartBeat = new PatchPoint();
		receiveSequencerHeartBeat.module = this.ourSequencer;
		receiveSequencerHeartBeat.messageType = "heartbeat";
		receiveSequencerHeartBeat.isSender = false;
		receiveSequencerHeartBeat.gui = this.ourSequencerGui;
		receiveSequencerHeartBeat.button = this.ourSequencerGui.receiveButton;

		this.ourPatcher.applyPatch(sendHeartBeat,receiveSequencerHeartBeat);
	}

	private stopped() {
		MRE.log.info("app", "stopped callback has been called");
		this.ourReceiver.removeReceiver(this.receiverCallback);
	}

	private started() {
		this.ourConsole.logMessage("started callback has begun");

		this.createMeshAndMaterial();

		this.menuGrabber = new GrabButton(this);
		this.menuGrabber.create(new MRE.Vector3(3, 0.1, 0));

		this.loadAsyncItems().then(() => {
			this.ourConsole.logMessage("all async items created/loaded!");
			this.receiverCallback = this.PianoReceiveCallback.bind(this)
			this.ourReceiver.addReceiver(this.receiverCallback);
		});
	}
}
