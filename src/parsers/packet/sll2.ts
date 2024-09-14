import { ARPPacket } from "./arpPacket";
import { GenericPacket } from "./genericPacket";
import { IPv4Packet } from "./ipv4Packet";
import { IPv6Packet } from "./ipv6Packet";
import { vlanPacket } from "./vlanPacket";

export class SLL2Packet extends GenericPacket {
	innerPacket: GenericPacket;

	static processPayload(proto: number, payload: DataView): GenericPacket {
		switch (proto) {
			case 0x800:
				if(payload.getUint8(0) >> 4 === 4) {
					return new IPv4Packet(payload);
				} else if(payload.getUint8(0) >> 4 === 6) {
					return new IPv6Packet(payload);
				} else {
					return new GenericPacket(payload);
				}
				break;
			case 0x806:
				return new ARPPacket(payload);
				break;
			case 0x8100:
				return new vlanPacket(payload);
				break;
			case 0x86dd:
				return new IPv6Packet(payload);
				break;
			default:
				return new GenericPacket(payload);
		}
	}

	constructor(packet: DataView) {
		super(packet);
		if (this.ARPHRDType === 1 /* Ethernet */ || this.ARPHRDType === 772 /* loopback */ ) {
			this.innerPacket = SLL2Packet.processPayload(this.proto, new DataView(packet.buffer, packet.byteOffset + 20, packet.byteLength - 20));
		} else {
			this.innerPacket = new GenericPacket(new DataView(packet.buffer, packet.byteOffset + 20, packet.byteLength - 20));
		}
	}
	
	get linkLayerAddress() {
		let ret = "";
		for (let i = 0; i < this.linkLayerAddressLength; i++) {
			ret += this.packet.getUint8(12+i).toString(16).padStart(2, "0") + ":";
		}
		return ret.substring(0, ret.length-1);
	}

	get proto() {
		return this.packet.getUint16(0);
	}
	get interfaceIndex() {
		return this.packet.getUint32(4);
	}
	get ARPHRDType() {
		return this.packet.getUint16(8);
	}
	get packetType() {
		return this.packet.getUint8(10);
	}
	get linkLayerAddressLength() {
		return this.packet.getUint8(11);
	}
	
	get toString() {
		// 00:11:22:33:44:55 > 00:11:22:33:44:55 (0x800)
		let type = "";
		switch (this.packetType) {
			case 0:
				type = `${this.linkLayerAddress} > (Us) `;  //received by us
				break;
			case 1:
				type = `${this.linkLayerAddress} > (Bc) `; //broadcast
				break;
			case 2:
				type = `${this.linkLayerAddress} > (Mc) `; //multicast
				break; 
			case 3:
				type = `${this.linkLayerAddress} > (So) `; //sent from someone else to someone else
				break;
			case 4:
				type = `${this.linkLayerAddress} > (So)`; //sent by us
				break;
			default:
				type = "";
		}
		return `${type} (0x${this.proto.toString(16).padStart(4, "0")}) ${this.innerPacket.toString}`;
	}

	get getProperties(): Array<any> {
		let proto = "";
		switch (this.proto) {
			case 0x800:
				proto = "IPv4 ";
				break;
			case 0x806:
				proto = "ARP ";
				break;
			case 0x8100:
				proto = "802.1Q Virtual LAN ";
				break;
			case 0x86dd:
				proto = "IPv6 ";
				break;
			default:
				proto = "";
		}

		let pktType = "";
		switch (this.packetType) {
			case 0:
				pktType = "Unicast to us (0)";
				break;
			case 1:
				pktType = "Broadcast (1)";
				break;
			case 2:
				pktType = "Multicast (2)";
				break;
			case 3:
				pktType = "To and from someone else (3)";
				break;
			case 4:
				pktType = "Sent by us (4)";
				break;
			default:
				pktType = "";
		}
		const arr: Array<any> = [];
		arr.push(`*Linux cooked capture v2`);
		arr.push(`Protocol: ${proto}(0x${this.proto.toString(16)})`);
		arr.push(`Interface index: ${this.interfaceIndex}`);
		arr.push(`Link-layer address type: ${this.ARPHRDType}`);
		arr.push(`Packet type: ${pktType}`);
		arr.push(`Link-layer address length: ${this.linkLayerAddressLength}`);
		arr.push(`Link-layer address: ${this.linkLayerAddress}`);

		return [arr, this.innerPacket.getProperties];
	}
}
