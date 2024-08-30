import { GenericPacket } from "./genericPacket";
import { ICMPPacket } from "./icmpPacket";
import { TCPPacket } from "./tcpPacket";
import { UDPPacket } from "./udpPacket";

export class IPv4Packet extends GenericPacket {
	packet: DataView;
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		switch (this.protocol) {
			case 0x01:
				this.innerPacket = new ICMPPacket(
					new DataView(packet.buffer, packet.byteOffset + this.ihl*4, this.totalLength - this.ihl*4),
				);
				break;
			case 0x06:
				this.innerPacket = new TCPPacket(
					new DataView(packet.buffer, packet.byteOffset + this.ihl*4, this.totalLength - this.ihl*4),
				);
				break;
			case 0x11:
				this.innerPacket = new UDPPacket(
					new DataView(packet.buffer, packet.byteOffset + this.ihl*4, this.totalLength - this.ihl*4),
				);
				break;
			default:
				this.innerPacket = new GenericPacket(
					new DataView(packet.buffer, packet.byteOffset + this.ihl*4, this.totalLength - this.ihl*4),
				);
		}
	
	}

	get version() {
		return this.packet.getUint8(0) >> 4;
	}

	get ihl() {
		return this.packet.getUint8(0) & 0xf;
	}

	get typeOfService() {
		return this.packet.getUint8(1);
	}

	get totalLength() {
		return this.packet.getUint16(2);
	}

	get identification() {
		return this.packet.getUint16(4);
	}

	get flags() {
		return this.packet.getUint8(6) >> 5;
	}
	
	get fragmentOffset() {
		return this.packet.getUint16(6) & 0x1fff;
	}

	get timeToLive() {
		return this.packet.getUint8(8);
	}

	get protocol() {
		return this.packet.getUint8(9);
	}

	get headerChecksum() {
		return this.packet.getUint16(10);
	}

	get srcAddress() {
		let ret = "";
		ret += this.packet.getUint8(12) + ".";
		ret += this.packet.getUint8(13) + ".";
		ret += this.packet.getUint8(14) + ".";
		ret += this.packet.getUint8(15);
		return ret;
	}

	get destAddress() {
		let ret = "";
		ret += this.packet.getUint8(16) + ".";
		ret += this.packet.getUint8(17) + ".";
		ret += this.packet.getUint8(18) + ".";
		ret += this.packet.getUint8(19);
		return ret;
	}

	get toString() {
		return `IPv${this.version}, ${this.ihl}, ${this.typeOfService}, ${this.totalLength}, ${this.identification}, ${this.flags}, ${this.fragmentOffset}, ${this.timeToLive}, 0x${this.protocol.toString(16).padStart(2, "0")}, ${this.headerChecksum}, ${this.srcAddress} > ${this.destAddress}, ${this.innerPacket.toString} `;
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Protocol Version 4");
		arr.push(`Version: ${this.version}`);
		arr.push(`Header Length: ${this.ihl*4} bytes (${this.ihl})`);
		arr.push(`Type of Service: ${this.typeOfService}`);
		arr.push(`Total Length: ${this.totalLength}`);
		arr.push(`Identification: 0x${this.identification.toString(16)} (${this.identification})`);
		arr.push(`Flags: 0x${this.flags.toString(16)}`);
		arr.push(`Fragment Offset: ${this.fragmentOffset}`);
		arr.push(`Time to Live: ${this.timeToLive}`);
		switch (this.protocol) {
			case 0x01:
				arr.push(`Protocol: ICMP (${this.protocol})`);
				break;
			case 0x06:
				arr.push(`Protocol: TCP (${this.protocol})`);
				break;
			case 0x11:
				arr.push(`Protocol: UDP (${this.protocol})`);
				break;
			default:
				arr.push(`Protocol: Unknown (${this.protocol})`);
		}
		arr.push(`Header Checksum: (${this.headerChecksum})`);
		arr.push(`Source Address: (${this.srcAddress})`);
		arr.push(`Destination Address: (${this.destAddress})`);

		return [arr, this.innerPacket.getProperties];
	}
}
