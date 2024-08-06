import { ARPPacket } from "./arpPacket";
import { GenericPacket } from "./genericPacket";
import { IPPacket } from "./ipPacket";

export class EthernetPacket {
	packet: DataView;
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		this.packet = packet;
		switch (this.proto) {
			case 0x800:
				this.innerPacket = new IPPacket(
					new DataView(packet.buffer, packet.byteOffset + 14, packet.byteLength - 14),
				);
				break;
			case 0x806:
				this.innerPacket = new ARPPacket(
					new DataView(packet.buffer, packet.byteOffset + 14, packet.byteLength - 14),
				);
				break;
			default:
				this.innerPacket = new GenericPacket(
					new DataView(packet.buffer, packet.byteOffset + 14, packet.byteLength - 14),
				);
		}
		
	}

	get dstMAC() {
		//00:11:22:33:44:55
		let ret = "";
		ret += this.packet.getUint8(0).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(1).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(2).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(3).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(4).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(5).toString(16).padStart(2, "0");
		return ret;
	}

	get srcMAC() {
		let ret = "";
		ret += this.packet.getUint8(6).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(7).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(8).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(9).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(10).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(11).toString(16).padStart(2, "0");
		return ret;
	}

	get proto() {
		return this.packet.getUint16(12);
	}

	get toString() {
		// 00:11:22:33:44:55 > 00:11:22:33:44:55 (0x800)
		return `${this.srcMAC} > ${this.dstMAC} (0x${this.proto.toString(16).padStart(4, "0")}) ${this.innerPacket.toString}`;
	}
}
