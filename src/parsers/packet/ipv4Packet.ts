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

	get options(): IPv4Option[] {
        const options: IPv4Option[] = [];

        if (this.ihl * 4 <= 20) {
            return [];
        }

        let i = 20; 
        try {
            while (i < this.ihl * 4) {
                const option = IPv4Option.create(new DataView(this.packet.buffer, this.packet.byteOffset + i, this.packet.byteLength - i));
                if (option.length > 0) {
                    i += option.length;
                    options.push(option);
                } else {
                    i += 1; 
                }
            }
        } catch (e) {
            
        }

        return options;
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
		if(this.options.length > 0) {
			const optArr: Array<any> = [];
			optArr.push(`Options`);
			this.options.forEach(item => {
				optArr.push(item.toString);
			});
			arr.push(optArr);
		}

		return [arr, this.innerPacket.getProperties];
	}
}

class IPv4Option {
    optionData: DataView;
    length: number;
    code: number;

    constructor(dv: DataView, offset: number, length: number, code: number) {
        this.optionData = new DataView(dv.buffer, offset, length);
        this.length = length;
        this.code = code;
    }

    static create(dv: DataView): IPv4Option {
		const type = dv.getUint8(0);
		switch (type) {
			case 0: // End of Option List
				return new IPv4Option(dv, 0, 0, 0);
			case 1:
				return new IPv4OptionNOP(dv, 0, 1, 1);
			case 2:
				return new IPv4OptionSecurity(dv, dv.byteOffset + 2, dv.getUint8(1), 2);
			case 3:
				return new IPv4OptionLooseSourceRouting(dv, dv.byteOffset + 2, dv.getUint8(1), 3);
			case 7:
				return new IPv4OptionRecordRoute(dv, dv.byteOffset + 2, dv.getUint8(1), 7);
			case 8:
				return new IPv4OptionStreamID(dv, dv.byteOffset + 2, dv.getUint8(1), 8);
			case 9:
				return new IPv4OptionStrictSourceRouting(dv, dv.byteOffset + 2, dv.getUint8(1), 9);
			case 68:
				return new IPv4OptionTimestamp(dv, dv.byteOffset + 2, dv.getUint8(1), 68);
			default:
				return new IPv4Option(dv, dv.byteOffset + 2, dv.getUint8(1), type);
		}
	}
	

    get toString(): string {
        return `Option: ${this.code}, Length: ${this.length}`;
    }
}

class IPv4OptionNOP extends IPv4Option {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get toString(): string {
        return `No-Operation (${this.code})`;
    }
}

class IPv4OptionRecordRoute extends IPv4Option {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get routeAddresses(): number[] {
        const addresses = [];
        for (let i = 0; i < this.length - 2; i += 4) {
            addresses.push(this.optionData.getUint32(i));
        }
        return addresses;
    }

    get toString(): string {
        return `Record Route Option (${this.code}) - Addresses: ${this.routeAddresses.join(', ')}`;
    }
}

class IPv4OptionSecurity extends IPv4Option {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get securityData(): Uint8Array {
        return new Uint8Array(this.optionData.buffer.slice(this.optionData.byteOffset, this.optionData.byteOffset + this.length));
    }

    get toString(): string {
        return `Security Option (${this.code}) - Data: ${Array.from(this.securityData).join(', ')}`;
    }
}

class IPv4OptionLooseSourceRouting extends IPv4Option {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get routeAddresses(): number[] {
        const addresses = [];
        for (let i = 0; i < this.length - 2; i += 4) {
            addresses.push(this.optionData.getUint32(i));
        }
        return addresses;
    }

    get toString(): string {
        return `Loose Source Routing Option (${this.code}) - Addresses: ${this.routeAddresses.join(', ')}`;
    }
}

class IPv4OptionStrictSourceRouting extends IPv4Option {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get routeAddresses(): number[] {
        const addresses = [];
        for (let i = 0; i < this.length - 2; i += 4) {
            addresses.push(this.optionData.getUint32(i));
        }
        return addresses;
    }

    get toString(): string {
        return `Strict Source Routing Option (${this.code}) - Addresses: ${this.routeAddresses.join(', ')}`;
    }
}

class IPv4OptionStreamID extends IPv4Option {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get streamID(): number {
        return this.optionData.getUint16(0);
    }

    get toString(): string {
        return `Stream ID Option (${this.code}) - StreamID: ${this.streamID}`;
    }
}

class IPv4OptionTimestamp extends IPv4Option {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get timestamps(): { address: number, timestamp: number }[] {
        const records = [];
        for (let i = 0; i < this.length - 4; i += 8) {
            records.push({
                address: this.optionData.getUint32(i),
                timestamp: this.optionData.getUint32(i + 4)
            });
        }
        return records;
    }

    get toString(): string {
        return `Internet Timestamp Option (${this.code}) - Records: ${this.timestamps.map(rec => `{Address: ${rec.address}, Timestamp: ${rec.timestamp}}`).join(', ')}`;
    }
}


