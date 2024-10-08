import { GenericPacket } from "./genericPacket";
import { DNSPacket } from "./dnsPacket";
import { DHCPPacket } from "./dhcpPacket";
import { vxlanPacket } from "./vxlanPacket";

export class UDPPacket extends GenericPacket {
	packet: DataView;
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		const dv = new DataView(packet.buffer, packet.byteOffset + 8, packet.byteLength - 8);
		if(this.destPort === 53 || this.srcPort === 53 || this.destPort === 5353 || this.srcPort === 5353) {
			this.innerPacket = new DNSPacket(dv);
			return;
		}

		if(this.destPort === 67 || this.srcPort === 67 || this.destPort === 68 || this.srcPort === 68) {
			this.innerPacket = new DHCPPacket(dv);
			return;
		}

		if(this.destPort === 4789) {
			this.innerPacket = new vxlanPacket(dv);
			return;
		}

		this.innerPacket = new GenericPacket(dv);
	}

	get srcPort() {
		return this.packet.getUint16(0);
	}

    get destPort() {
		return this.packet.getUint16(2);
	}

    get length() {
		return this.packet.getUint16(4);
	}

    get checksum() {
        return this.packet.getUint16(6);
    }

	

	get toString() {
		return `UDP ${this.srcPort} > ${this.destPort}, ${this.innerPacket.toString}`;
	}

	get getProperties() {
		const arr: Array<any> = [];
		arr.push(`User Datagram Protocol`);
		arr.push(`Source Port: ${this.srcPort}`);
		arr.push(`Destination Port: ${this.destPort}`);
		arr.push(`Length: ${this.length}`);
		arr.push(`Checksum: 0x${this.checksum.toString(16)}`);
		
		return [arr, this.innerPacket.getProperties];
	}
}
