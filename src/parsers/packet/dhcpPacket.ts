import { GenericPacket } from "./genericPacket";

export class DHCPPacket extends GenericPacket {
    packet: DataView;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
	}

	get op() {
		return this.packet.getUint8(0);
	}

	get htype() {
		return this.packet.getUint8(1);
	}

	get htypeString() {
		switch (this.htype) {
			case 1:
				return "Ethernet";
			case 2:
				return "Experimental Ethernet";
			case 3:
				return "Amateur Radio AX.25";
			case 4:
				return "Proteon ProNET Token Ring";
			case 5:
				return "Chaos";
			case 6:
				return "IEEE 802 Networks";
			case 7:
				return "ARCNET";
			case 8:
				return "Hyperchannel";
			case 9:
				return "Lanstar";
			case 10:
				return "Autonet Short Address";
			case 11:
				return "LocalTalk";
			case 12:
				return "LocalNet";
			case 13:
				return "Ultra link";
			case 14:
				return "SMDS";
			case 15:
				return "Frame Relay";
			case 16:
				return "Asynchronous Transmission Mode";
			case 17:
				return "HDLC";
			case 18:
				return "Fibre Channel";
			case 19:
				return "Asynchronous Transmission Mode";
			case 20:
				return "Serial Line";
			case 21:
				return "Asynchronous Transmission Mode";
			default:
				return "Unknown network type";
		}
	}

    get hlen() {
		return this.packet.getUint8(2);
	}

    get hops() {
		return this.packet.getUint8(3);
	}

	get xid() {
		return this.packet.getUint32(4);
	}

    get secs() {
		return this.packet.getUint16(8);
	}

    get flags() {
		return this.packet.getUint16(10);
	}

    get ciaddr() {
		let ret = "";
		ret += this.packet.getUint8(12) + ".";
		ret += this.packet.getUint8(13) + ".";
		ret += this.packet.getUint8(14) + ".";
		ret += this.packet.getUint8(15);
		return ret;
	}
    
    get yiaddr() {
		let ret = "";
		ret += this.packet.getUint8(16) + ".";
		ret += this.packet.getUint8(17) + ".";
		ret += this.packet.getUint8(18) + ".";
		ret += this.packet.getUint8(19);
		return ret;
	}

    get siaddr() {
		let ret = "";
		ret += this.packet.getUint8(20) + ".";
		ret += this.packet.getUint8(21) + ".";
		ret += this.packet.getUint8(22) + ".";
		ret += this.packet.getUint8(23);
		return ret;
	}

    get giaddr() {
		let ret = "";
		ret += this.packet.getUint8(24) + ".";
		ret += this.packet.getUint8(25) + ".";
		ret += this.packet.getUint8(26) + ".";
		ret += this.packet.getUint8(27);
		return ret;
	}

    get chaddr() {
		let ret = "";
        for(let i = 0; i < this.hlen; i++) {
            ret += this.packet.getUint8(28 + i).toString(16).padStart(2, "0");
            if(i !== this.hlen-1) {
                ret += ":";
            }
        }
        return ret;
	}

	get sname() {
		const decoder = new TextDecoder(`utf-8`);
		const sname = decoder.decode(new DataView(this.packet.buffer, this.packet.byteOffset + 44, 64)).split(`\0`)[0];
		return sname;
	}

	get file() {
		const decoder = new TextDecoder(`utf-8`);
		const file = decoder.decode(new DataView(this.packet.buffer, this.packet.byteOffset + 108, 128)).split(`\0`)[0];
		return file;
	}

	get options(): DHCPOption[] {
		if(this.packet.byteLength <= 240) {
			return [];
		}
		let i = this.packet.byteOffset + 240;
		const options: DHCPOption[] = [];
		try {
			do {
				const option = DHCPOption.create(new DataView(this.packet.buffer, i, this.packet.buffer.byteLength - i));
				if(option.length > 0) {
					i += option.length + 2;
					options.push(option);
				} else {
					i += 1;
					
				}
				
			} while(DHCPOption.create(new DataView(this.packet.buffer, i, this.packet.buffer.byteLength - i)).code !== 255);
		} catch(e) {
			
		} 
		return options;
	}
	
	get toString() {
		let optionsText: string = "";
		this.options.forEach(item => {optionsText += item.toString + " ";});
		optionsText = optionsText.trimEnd();

		return `DHCP: chaddr: ${this.chaddr}${this.sname.length ? ", sname: " + this.sname : ""}${this.options.length ? " options: " + optionsText : ""}`;
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Dynamic Host Configuration Protocol");
		if(this.op === 1) {
			arr.push(`Message type: Boot Request (${this.op})`);
		} else {
			arr.push(`Message type: Boot Reply (${this.op})`);
		}
		arr.push(`Hardware type: ${this.htypeString} (0x${this.op.toString(16)})`);
		arr.push(`Hardware address length: ${this.hlen}`);
		arr.push(`Hops: ${this.hops}`);
		arr.push(`Transaction ID: ${this.xid}`);
		arr.push(`Seconds elapsed: ${this.secs}`);
		if(this.flags === 0x8000) {
			arr.push(`Bootp flags: 0x${this.flags.toString(16)} (Broadcast)`);
		} else {
			arr.push(`Bootp flags: 0x${this.flags.toString(16)} (Unicast)`);
		}
		arr.push(`Client IP address: ${this.ciaddr}`);
		arr.push(`Your (Client) IP address: ${this.yiaddr}`);
		arr.push(`Next server IP address: ${this.siaddr}`);
		arr.push(`Relay agent IP address: ${this.giaddr}`);
		arr.push(`Client MAC address: ${this.chaddr}`);
		arr.push(`Server host name${this.sname.length ? ": " + this.sname : " not given"}`);
		arr.push(`Boot file name${this.file.length ? ": " + this.file : " not given"}`);
		if(this.options.length > 0) {
			const optArr: Array<any> = [];
			optArr.push(`Options`);
			this.options.forEach(item => {
				optArr.push(item.toString);
			});
			arr.push(optArr);
		}
		return arr;
	}
}

class DHCPOption {
    optionData: DataView;
    length: number;
    code: number;

    constructor(dv: DataView, offset: number, length: number, code: number) {
        this.optionData = new DataView(dv.buffer, offset, length);
        this.length = length;
        this.code = code;
    }

    static create(dv: DataView): DHCPOption {
        switch(dv.getUint8(0)) {
            case 0:
                return new DHCPOption(dv, 0, 0, 0);
            case 12:
                return new DHCPOptionHostName(dv, dv.byteOffset + 2, dv.getUint8(1), 12);
            case 50:
                return new DHCPOptionRequestedAddress(dv, dv.byteOffset + 2, 4, 50);
            case 51:
                return new DHCPOptionIPLeaseTime(dv, dv.byteOffset + 2, 4, 51);
            case 53:
                return new DHCPOptionMessageType(dv, dv.byteOffset + 2, 1, 53);
            case 54:
                return new DHCPOptionServerIdentifier(dv, dv.byteOffset + 2, 4, 54);
            case 58:
                return new DHCPOptionT1(dv, dv.byteOffset + 2, 4, 58);
            case 59:
                return new DHCPOptionT2(dv, dv.byteOffset + 2, 4, 59);
            case 255:
                return new DHCPOption(dv, 0, 0, 255);
            default:
                return new DHCPOption(dv, dv.byteOffset+2, dv.getUint8(1), dv.getUint8(0));
        }
    }

    get toString(): string {
        return `Unknown Option (${this.code})`;
    }
}

// Host Name
class DHCPOptionHostName extends DHCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get hostName(): string {
        const encoder = new TextDecoder();
        return encoder.decode(this.optionData.buffer.slice(this.optionData.byteOffset, this.optionData.byteOffset + this.length));
    }

    get toString(): string {
        return `Host Name Option (${this.code}): ${this.hostName}`;
    }
}

// Requested IP Address
class DHCPOptionRequestedAddress extends DHCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get requestedAddress(): string {
        const address = this.optionData.getUint32(0);
        return [
            (address >> 24) & 0xFF,
            (address >> 16) & 0xFF,
            (address >> 8) & 0xFF,
            address & 0xFF
        ].join('.');
    }

    get toString(): string {
        return `Requested Address Option (${this.code}): ${this.requestedAddress}`;
    }
}

// IP Lease Time
class DHCPOptionIPLeaseTime extends DHCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get leaseTime(): number {
        return this.optionData.getUint32(0);
    }

    get toString(): string {
        return `IP Lease Time Option (${this.code}): ${this.leaseTime} seconds`;
    }
}

// Message Type
class DHCPOptionMessageType extends DHCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get messageType(): number {
        return this.optionData.getUint8(0);
    }

    get messageTypeDescription(): string {
        switch (this.messageType) {
            case 1:
                return 'DHCP Discover';
            case 2:
                return 'DHCP Offer';
            case 3:
                return 'DHCP Request';
            case 4:
                return 'DHCP Decline';
            case 5:
                return 'DHCP ACK';
            case 6:
                return 'DHCP NAK';
            case 7:
                return 'DHCP Release';
            case 8:
                return 'DHCP Inform';
            default:
                return 'Unknown';
        }
    }

    get toString(): string {
        return `Message Type Option (${this.code}): ${this.messageTypeDescription} (${this.messageType})`;
    }
}

// Server Identifier
class DHCPOptionServerIdentifier extends DHCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get serverIdentifier(): string {
        const address = this.optionData.getUint32(0);
        return [
            (address >> 24) & 0xFF,
            (address >> 16) & 0xFF,
            (address >> 8) & 0xFF,
            address & 0xFF
        ].join('.');
    }

    get toString(): string {
        return `Server Identifier Option (${this.code}): ${this.serverIdentifier}`;
    }
}

// T1 (Renewal Time)
class DHCPOptionT1 extends DHCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get t1(): number {
        return this.optionData.getUint32(0);
    }

    get toString(): string {
        return `Renewal Time Option (${this.code}): ${this.t1} seconds`;
    }
}

// T2 (Rebinding Time)
class DHCPOptionT2 extends DHCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get t2(): number {
        return this.optionData.getUint32(0);
    }

    get toString(): string {
        return `Rebinding Time Option (${this.code}): ${this.t2} seconds`;
    }
}

