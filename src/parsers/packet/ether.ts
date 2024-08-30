import { ARPPacket } from "./arpPacket";
import { GenericPacket } from "./genericPacket";
import { IPv4Packet } from "./ipv4Packet";
import { IPv6Packet } from "./ipv6Packet";

export class EthernetPacket {
	packet: DataView;
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		this.packet = packet;
		switch (this.proto) {
			case 0x800:
				if(this.packet.getUint8(14) >> 4 === 4) {
					this.innerPacket = new IPv4Packet(
						new DataView(packet.buffer, packet.byteOffset + 14, packet.byteLength - 14),
					);
				} else if(this.packet.getUint8(0) >> 4 === 6) {
					this.innerPacket = new IPv6Packet(
						new DataView(packet.buffer, packet.byteOffset + 14, packet.byteLength - 14),
					);
				} else {
					this.innerPacket = new GenericPacket(
						new DataView(packet.buffer, packet.byteOffset + 14, packet.byteLength - 14),
					);
				}
				break;

			case 0x806:
				this.innerPacket = new ARPPacket(
					new DataView(packet.buffer, packet.byteOffset + 14, packet.byteLength - 14),
				);
				break;
			case 0x86dd:
				this.innerPacket = new IPv6Packet(
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

	get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("*Ethernet II");
		arr.push(`Source Address: ${this.srcMAC}`);
		arr.push(`Destination Address: ${this.dstMAC}`);
		switch (this.proto) {
			case 0x800:
				if(this.packet.getUint8(14) >> 4 === 4) {
					arr.push(`Type: IPv4 (0x${this.proto.toString(16)})`);
				} else if(this.packet.getUint8(0) >> 4 === 6) {
					arr.push(`Type: IPv6 (0x${this.proto.toString(16)})`);
				} else {
					arr.push(`Type: Unknown (0x${this.proto.toString(16)})`);
				}
				break;

			case 0x806:
				arr.push(`Type: ARP (0x${this.proto.toString(16)})`);
				break;
			case 0x86dd:
				arr.push(`Type: IPv6 (0x${this.proto.toString(16)})`);
				break;
			default:
				arr.push(`Type: Unknown (0x${this.proto.toString(16)})`);
		}

		return [arr, this.innerPacket.getProperties];
	}
}
