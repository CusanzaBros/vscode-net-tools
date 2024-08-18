import { GenericPacket } from "./genericPacket";
import { Address6 } from "ip-address";

export class ICMPv6Packet extends GenericPacket {
	packet: DataView;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
	}

    get message() {
        return ICMPv6Message.create(this.packet).toString;
    }

	

	get toString() {
		return `ICMPv6 ${this.message} `;
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
        return this.packet.getUint8(0)
    }

    get code() {
        return this.packet.getUint8(1)
    }

    get checksum() {
        return this.packet.getUint16(2)
    }

}

class ICMPv6Error extends ICMPv6Message {

    constructor(dv: DataView) {
        super(dv);
    }

    static create(dv:DataView): ICMPv6Error {
        switch(dv.getUint8(0)) {
            case 1:

            default:
                return new ICMPv6Error(dv);
        }
    }

    get toString() {
        return `Type: ${this.type} Code: ${this.code}`;
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
			ret += this.packet.getUint8(i).toString(16).padStart(2, "0") + " ";
		}
		return ret.trimEnd();
    }

    get toString() {
        return `Echo Response, Identifier: ${this.code} Sequence Num: ${this.sequenceNum} Data: ${this.data}`;
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
			if(i == 5) {
				break;
			}
			ret += ":";
		}
		return ret;
    }
    


    get toString() {
        return `Neighbor Solicitation, Target Address: ${this.targetAddress.correctForm()}${this.packet.byteLength > 24 ? " Options: " + this.options: ""}`;
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
			if(i == 5) {
				break;
			}
			ret += ":";
		}
		return ret;
    }
    


    get toString() {
        return `Neighbor Advertisement, Target Address: ${this.targetAddress.correctForm()}, Flags: ${this.getFlags}${this.packet.byteLength > 24 ? " " + this.options: ""}`;
    }
}
