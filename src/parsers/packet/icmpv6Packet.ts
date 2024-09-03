import { GenericPacket } from "./genericPacket";
import { Address6 } from "ip-address";

export class ICMPv6Packet extends GenericPacket {
	packet: DataView;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
	}

    get message(): ICMPv6Message {
        return ICMPv6Message.create(this.packet);
    }

	get toString() {
		return `ICMPv6 ${this.message.toString} `;
	}

    get getProperties() {
        return this.message.getProperties;
    }
}

class ICMPv6Message {
    packet: DataView;

    constructor(dv:DataView) {
        this.packet = dv;
    }

    static create(dv: DataView): ICMPv6Message {
        if(dv.getUint8(0) < 128 ) {
            return ICMPv6Error.create(dv);
        } else {
            return ICMPv6Info.create(dv);
        }
    }

    get type() {
        return this.packet.getUint8(0);
    }

    get code() {
        return this.packet.getUint8(1);
    }

    get checksum() {
        return this.packet.getUint16(2);
    }
    
    get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Control Message Protocol v6");
		arr.push(`Type: Unknown Message Type (${this.type})`);
		arr.push(`Code: (${this.code})`);
		arr.push(`Checksum: (0x${this.checksum.toString(16)})`);
		return arr;
	}
}

class ICMPv6Error extends ICMPv6Message {

    constructor(dv: DataView) {
        super(dv);
    }

    static create(dv:DataView): ICMPv6Error {
        switch(dv.getUint8(0)) {
            case 1:
                return new ICMPv6DestinationUnreachable(dv);
            case 2:
                return new ICMPv6PacketTooBig(dv);
            case 3:
                return new ICMPv6TimeExceeded(dv);
            case 4:
                return new ICMPv6ParameterProblem(dv);
            default:
                return new ICMPv6Error(dv);
        }
    }

    get invokingPacket() {
        return "not done";
    }

    get toString() {
        return `Type: ${this.type} Code: ${this.code} Invoking Packet: ${this.invokingPacket}`;
    }
    
}

class ICMPv6Info extends ICMPv6Message {

    constructor(dv: DataView) {
        super(dv);
    }

    static create(dv:DataView): ICMPv6Info {
        switch(dv.getUint8(0)) {
            case 128:
                return new ICMPv6EchoRequest(dv);
            case 129:
                return new ICMPv6EchoReply(dv);
            case 135:
                return new ICMPv6NeighborSolicitation(dv);
            case 136:
                return new ICMPv6NeighborAdvertisement(dv);
            default:
                return new ICMPv6Info(dv);
        }
    }

    get toString() {
        return `Type: ${this.type} Code: ${this.code}`;
    }
}

class ICMPv6EchoRequest extends ICMPv6Info {

    constructor(dv: DataView) {
        super(dv);
    }

    get identifier() {
        return this.packet.getUint16(4);
    }

    get sequenceNum() {
        return this.packet.getUint16(6);
    }

    get data() {
        let ret = "";
		for (let i = 8; i < this.packet.byteLength; i++) {
			ret += this.packet.getUint8(i).toString(16).padStart(2, "0");
		}
		return ret;
    }

    get toString() {
        return `Echo Request, Identifier: ${this.code} Sequence Num: ${this.sequenceNum} Data: ${this.data}`;
    }

    get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Control Message Protocol v6");
		arr.push(`Type: Echo Request (${this.type})`);
		arr.push(`Code: (${this.code})`);
		arr.push(`Checksum: (0x${this.checksum.toString(16)})`);
		arr.push(`Identifier: (0x${this.identifier.toString(16)})`);
        arr.push(`Sequence: (${this.sequenceNum})`);
        arr.push(`<ul> <li> <details> <summary> Data (32 Bytes) </summary> <ul> <li> ${this.data} </li> </ul> </details> </li> </ul>`);
		return arr;
	}
}

class ICMPv6EchoReply extends ICMPv6Info {
    
    constructor(dv: DataView) {
        super(dv);
    }

    get identifier() {
        return this.packet.getUint16(4);
    }

    get sequenceNum() {
        return this.packet.getUint16(6);
    }
    
    get data() {
        let ret = "";
		for (let i = 8; i < this.packet.byteLength; i++) {
			ret += this.packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
    }

    get toString() {
        return `Echo Reply, Identifier: ${this.code} Sequence Num: ${this.sequenceNum} Data: ${this.data}`;
    }

    get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Control Message Protocol v6");
		arr.push(`Type: Echo Reply (${this.type})`);
		arr.push(`Code: (${this.code})`);
		arr.push(`Checksum: (0x${this.checksum.toString(16)})`);
		arr.push(`Identifier: (0x${this.identifier.toString(16)})`);
        arr.push(`Sequence: (${this.sequenceNum})`);
        arr.push(`<ul> <li> <details> <summary> Data (32 Bytes) </summary> <ul> <li> ${this.data} </li> </ul> </details> </li> </ul>`);
		return arr;
	}
}

class ICMPv6NeighborSolicitation extends ICMPv6Info {
    
    constructor(dv: DataView) {
        super(dv);
    }

    get targetAddress() {
        const a = this.packet.buffer.slice(this.packet.byteOffset+8, this.packet.byteOffset+8+16);
		const ua = new Uint8Array(a);
		const na = Array.from(ua);
		return Address6.fromByteArray(na);
    }   

    get options() {
        let ret = "Source Link-layer Address: ";
		for(let i = 0; i < 6; i++) {
			ret += this.packet.getUint8(26 + i).toString(16).padStart(2, "0");
			if(i === 5) {
				break;
			}
			ret += ":";
		}
		return ret;
    }
    


    get toString() {
        return `Neighbor Solicitation, Target Address: ${this.targetAddress.correctForm()}${this.packet.byteLength > 24 ? " Options: " + this.options: ""}`;
    }

    get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Control Message Protocol v6");
		arr.push(`Type: Neighbor Solicitation (${this.type})`);
		arr.push(`Code: (${this.code})`);
		arr.push(`Checksum: (0x${this.checksum.toString(16)})`);
		arr.push(`Reserved: 00000000`);
        arr.push(`Target Address: (${this.targetAddress.correctForm()})`);
        arr.push(`ICMPv6 Option: ${this.options}`);
		return arr;
	}
}

class ICMPv6NeighborAdvertisement extends ICMPv6Info {
    
    constructor(dv: DataView) {
        super(dv);
    }

    get r() {
        return this.packet.getUint8(4) >> 7 !== 0;
    }

    get s() {
        return (this.packet.getUint8(4) && 0x40) !==0;
    }

    get o() {
        return (this.packet.getUint8(4) && 0x20) !==0;
    }

    get getFlags(): string {
		let buffer: string = "";
		if(this.r) {
			buffer += "Reserved";
		}
        if(this.r && this.s) {
            buffer += ", ";
        }
        if(this.s) {
			buffer += "Solicited";
		}
        if(this.o && (this.r || this.s)) {
            buffer += ", ";
        }
        if(this.o) {
			buffer += "Override";
		}
		return buffer.trimEnd();
	}


    get targetAddress() {
        const a = this.packet.buffer.slice(this.packet.byteOffset+8, this.packet.byteOffset+8+16);
		const ua = new Uint8Array(a);
		const na = Array.from(ua);
		return Address6.fromByteArray(na);
    }   

    get options() {
        let ret = "Target Link-layer Address: ";
		for(let i = 0; i < 6; i++) {
			ret += this.packet.getUint8(26 + i).toString(16).padStart(2, "0");
			if(i === 5) {
				break;
			}
			ret += ":";
		}
		return ret;
    }
    


    get toString() {
        return `Neighbor Advertisement, Target Address: ${this.targetAddress.correctForm()}, Flags: ${this.getFlags}${this.packet.byteLength > 24 ? " " + this.options: ""}`;
    }

    get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Control Message Protocol v6");
		arr.push(`Type: Neighbor Advertisement (${this.type})`);
		arr.push(`Code: (${this.code})`);
		arr.push(`Checksum: (0x${this.checksum.toString(16)})`);
        arr.push(`Flags: ${this.getFlags}`);
		arr.push(`Reserved: 00000000`);
        arr.push(`Target Address: (${this.targetAddress.correctForm()})`);
        arr.push(`ICMPv6 Option: ${this.options}`);
		return arr;
	}
}

class ICMPv6DestinationUnreachable extends ICMPv6Error {
    
    constructor(dv: DataView) {
        super(dv);
    }

    get codeMessage() {
        switch(this.code) {
            case 0:
                return "No route to destination";
            case 1:
                return "Communication with destination administratively prohibited";
            case 2:
                return "Beyond scope of source address";
            case 3:
                return "Address unreachable";
            case 4:
                return "Port unreachable";
            case 5:
                return "Source address failed ingress/egress policy";
            case 6:
                return "Reject route to destination";
            default:
                return;

        }
    }

    get toString() {
        return `Destination Unreachable Error: ${this.codeMessage}, Invoking Packet: ${this.invokingPacket}`;
    }

    get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Control Message Protocol v6");
		arr.push(`Type: Destination Unreachable (${this.type})`);
		arr.push(`Code: ${this.codeMessage} (${this.code})`);
		arr.push(`Checksum: (0x${this.checksum.toString(16)})`);
		arr.push(`<ul> <li> <details> <summary> Invoking Packet </summary> <ul> <li> ${this.invokingPacket} </li> </ul> </details> </li> </ul>`);
		return arr;
	}
    
}

class ICMPv6PacketTooBig extends ICMPv6Error {
    
    constructor(dv: DataView) {
        super(dv);
    }

    get mtu() {
        return this.packet.getUint32(4);
    }

    get toString() {
        return `Packet Too Big Error, MTU: ${this.mtu}, Invoking Packet: ${this.invokingPacket}`;
    }

    get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Control Message Protocol v6");
		arr.push(`Type: Packet Too Big (${this.type})`);
		arr.push(`Code: (${this.code})`);
		arr.push(`Checksum: (0x${this.checksum.toString(16)})`);
        arr.push(`Code: (${this.mtu})`);
		arr.push(`<ul> <li> <details> <summary> Invoking Packet </summary> <ul> <li> ${this.invokingPacket} </li> </ul> </details> </li> </ul>`);
		return arr;
	}
}

class ICMPv6TimeExceeded extends ICMPv6Error {
    
    constructor(dv: DataView) {
        super(dv);
    }

    get codeMessage() {
        switch(this.code) {
            case 0:
                return "Hop limit exceeded in transit";
            case 1:
                return "Fragment reassembly time exceeded";
            default:
                return;

        }
    }

    get toString() {
        return `Time Exceeded Error: ${this.codeMessage}, Invoking Packet: ${this.invokingPacket}`;
    }

    get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Control Message Protocol v6");
		arr.push(`Type: Destination Unreachable (${this.type})`);
		arr.push(`Code: ${this.codeMessage} (${this.code})`);
		arr.push(`Checksum: (0x${this.checksum.toString(16)})`);
		arr.push(`<ul> <li> <details> <summary> Invoking Packet </summary> <ul> <li> ${this.invokingPacket} </li> </ul> </details> </li> </ul>`);
		return arr;
	}
}

class ICMPv6ParameterProblem extends ICMPv6Error {
    
    constructor(dv: DataView) {
        super(dv);
    }
    
    get pointer() {
        return this.packet.getUint32(4);
    }

    get codeMessage() {
        switch(this.code) {
            case 0:
                return "Erroneous header field encountered";
            case 1:
                return "Unrecognized Next Header type encountered";
            case 2:
                return "Unrecognized IPv6 option encountered";
            default:
                return;

        }
    }

    get toString() {
        return `Parameter Problem Error: ${this.codeMessage}, Pointer: ${this.pointer}, Invoking Packet: ${this.invokingPacket}`;
    }

    get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Internet Control Message Protocol v6");
		arr.push(`Type: Destination Unreachable (${this.type})`);
		arr.push(`Code: ${this.codeMessage} (${this.code})`);
		arr.push(`Checksum: (0x${this.checksum.toString(16)})`);
        arr.push(`Pointer: ${this.pointer}`);
		arr.push(`<ul> <li> <details> <summary> Invoking Packet </summary> <ul> <li> ${this.invokingPacket} </li> </ul> </details> </li> </ul>`);
		return arr;
	}
}
