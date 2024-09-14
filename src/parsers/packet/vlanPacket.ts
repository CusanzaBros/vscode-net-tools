import { GenericPacket } from "./genericPacket";
import { EthernetPacket } from "./ether";

export class vlanPacket extends GenericPacket {
	innerPacket: GenericPacket;
	private _lines:string[] = [];

	constructor(packet: DataView) {
		super(packet);
		this.innerPacket = EthernetPacket.processPayload(this.proto, new DataView(packet.buffer, packet.byteOffset + 4, packet.byteLength - 4));
	}

	get TCI():number {
		return this.packet.getUint16(0);
	}
	get PCP():number {
		return this.TCI >> 13;
	}
	get DEI():number {
		return (this.TCI >> 12) & 0x1;
	}
	get VID():number {
		return (this.TCI & 0x0FFF);
	}

	get proto() {
		return this.packet.getUint16(2);
	}

	get toString() {
		return `VLAN ${this.VID} (0x${this.proto.toString(16).padStart(4, "0")}) ${this.innerPacket.toString}`;
	}

	get getProperties() {
		let Pri = ["Best effort (default)", "Background (lowest)", "Excellent effort", "Critical applications", "Video, <100 ms latency and jitter", "Video, <10ms latency and jitter", "Internetwork control", "Network control"];
		const vlanInfo: Array<any> = [
			`802.1Q Virtual LAN, PRI: ${this.PCP}, DEI: ${this.DEI}, ID: ${this.VID}`,
			`Priority: ${Pri[this.PCP]} (${this.PCP})`,
			`DEI: ${this.DEI === 0 ? "Ineligible" : "Eligible" }`,
			`ID: ${this.VID}` 
		];
		
		return [ vlanInfo, this.innerPacket.getProperties ];
	}
}

