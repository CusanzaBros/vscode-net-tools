import { GenericPacket } from "./genericPacket";
import { EthernetPacket } from "./ether";

export class vxlanPacket extends GenericPacket {
	innerPacket: GenericPacket;
	private _lines:string[] = [];

	constructor(packet: DataView) {
		super(packet);
		this.innerPacket = new EthernetPacket(new DataView(packet.buffer, packet.byteOffset + 8, packet.byteLength - 8));
	}

	get VNIFlag():boolean {
		return (this.packet.getUint8(0) & 0x8) > 0;
	}
	get GBPFlag():boolean {
		return (this.packet.getUint8(0) & 0x80) > 0;
	}
	get DontLearnFlag():boolean {
		return (this.packet.getUint8(1) & 0x40) > 0;
	}
	get PolicyAppliedFlag():boolean {
		return (this.packet.getUint8(1) & 0x8) > 0;
	}
	get Flags():number {
		return this.packet.getUint16(0);
	}
	get GroupPolicyID():number {
		return this.packet.getUint16(2);
	}
	get VNI():number {
		return this.packet.getUint32(4) >> 8;
	}

	get toString() {
		return `VXLAN ${this.VNI}: ${this.innerPacket.toString}`;
	}

	get getProperties() {
		const vxlanInfo: Array<any> = [
			`Virtual eXtensible Local Area Network`,
			[
				`Flags: 0x${this.Flags.toString(16).padStart(4, "0")}`,
				`GBP Extension: ${this.GBPFlag }`,
				`VXLAN Network ID (VNI): ${this.VNIFlag }`,
				`Don't Learn: ${this.DontLearnFlag }`,
				`Policy Applied: ${this.PolicyAppliedFlag }`
			],
			`Group Policy ID: ${this.GroupPolicyID}`,
			`VXLAN Network Identifier (VNI): ${this.VNI}` 
		];
		
		return [ vxlanInfo, this.innerPacket.getProperties ];
	}
}

