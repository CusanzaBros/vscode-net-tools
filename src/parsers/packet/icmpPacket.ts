import { GenericPacket } from "./genericPacket";

export class ICMPPacket extends GenericPacket {
    packet: DataView;

    constructor(packet: DataView) {
        super(packet);
        this.packet = packet;
    }

    get message(): ICMPMessage {
        return ICMPMessage.create(this.packet);
    }

    get toString() {
        return `ICMP ${this.message.toString}`;
    }

    get getProperties() {
        return this.message.getProperties;
    }
}

class ICMPMessage {
    packet: DataView;

    constructor(dv: DataView) {
        this.packet = dv;
    }

    getOriginalData() {
        let ret = "";
        for (let i = 8; i < Math.min(this.packet.byteLength, 16); i++) {
            ret += this.packet.getUint8(i).toString(16).padStart(2, "0");
        }
        return ret;
    }

    static create(dv: DataView): ICMPMessage {
	
		switch (dv.getUint8(0)) {
			case 0: 
				return new ICMPEchoReply(dv);
			case 3:  
				return new ICMPDestinationUnreachable(dv);
			case 4: 
				return new ICMPSourceQuench(dv);
			case 5: 
				return new ICMPRedirect(dv);
			case 8: 
				return new ICMPEchoRequest(dv);
			case 11: 
				return new ICMPTimeExceeded(dv);
			case 12: 
				return new ICMPParameterProblem(dv);
			case 13:
				return new ICMPTimestamp(dv);
			case 14: 
				return new ICMPTimestampReply(dv);
			case 15: 
				return new ICMPInformationRequest(dv);
			case 16: 
				return new ICMPInformationReply(dv);
			default:
				return new ICMPMessage(dv); 
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

    get toString() {
        return `Unknown ICMP Type: ${this.type}, Code: ${this.code}`;
    }

    get getProperties(): Array<any> {
        return [
            "Internet Control Message Protocol",
            `Type: Unknown (${this.type})`,
            `Code: (${this.code})`,
            `Checksum: (0x${this.checksum.toString(16)})`
        ];
    }
}

class ICMPDestinationUnreachable extends ICMPMessage {
    get codeMessage() {
        switch (this.code) {
            case 0: return "Net unreachable";
            case 1: return "Host unreachable";
            case 2: return "Protocol unreachable";
            case 3: return "Port unreachable";
            case 4: return "Fragmentation needed and DF set";
            case 5: return "Source route failed";
            default: return "Unknown code";
        }
    }

    get originalData() {
        return this.getOriginalData();
    }

    get toString() {
        return `Destination Unreachable: ${this.codeMessage}`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            `Type: Destination Unreachable (${this.type})`,
            `Code: ${this.codeMessage} (${this.code})`,
            `Checksum: (0x${this.checksum.toString(16)})`,
            `Original Data: ${this.originalData}`
        ];
    }
}

class ICMPSourceQuench extends ICMPMessage {
    get originalData() {
        return this.getOriginalData();
    }

    get toString() {
        return "Source Quench";
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            "Type: Source Quench",
            `Code: (${this.code})`,
            `Checksum: (0x${this.checksum.toString(16)})`,
            `Original Data: ${this.originalData}`
        ];
    }
}

class ICMPRedirect extends ICMPMessage {
    get originalData() {
        return this.getOriginalData();
    }

    get toString() {
        return `Redirect`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            "Type: Redirect",
            `Code: (${this.code})`,
            `Checksum: (0x${this.checksum.toString(16)})`,
            `Original Data: ${this.originalData}`
        ];
    }
}

class ICMPTimeExceeded extends ICMPMessage {
    get codeMessage() {
        switch (this.code) {
            case 0: return "TTL expired in transit";
            case 1: return "Fragment reassembly time exceeded";
            default: return "Unknown code";
        }
    }

    get originalData() {
        return this.getOriginalData();
    }

    get toString() {
        return `Time Exceeded: ${this.codeMessage}`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            `Type: Time Exceeded (${this.type})`,
            `Code: ${this.codeMessage} (${this.code})`,
            `Checksum: (0x${this.checksum.toString(16)})`,
            `Original Data: ${this.originalData}`
        ];
    }
}

class ICMPParameterProblem extends ICMPMessage {
    get pointer() {
        return this.packet.getUint32(4);
    }

    get codeMessage() {
        switch (this.code) {
            case 0: return "Pointer indicates error";
            case 1: return "Missing required option";
            case 2: return "Bad length";
            default: return "Unknown code";
        }
    }

    get originalData() {
        return this.getOriginalData();
    }

    get toString() {
        return `Parameter Problem: ${this.codeMessage}, Pointer: ${this.pointer}`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            `Type: Parameter Problem (${this.type})`,
            `Code: ${this.codeMessage} (${this.code})`,
            `Pointer: ${this.pointer}`,
            `Checksum: (0x${this.checksum.toString(16)})`,
            `Original Data: ${this.originalData}`
        ];
    }
}


class ICMPEchoRequest extends ICMPMessage {

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
        return `Echo Request, Identifier: ${this.identifier}, Sequence: ${this.sequenceNum}`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            "Type: Echo Request (8)",
            `Identifier: ${this.identifier}`,
            `Sequence: ${this.sequenceNum}`,
            `Checksum: (0x${this.checksum.toString(16)})`,
			`<ul> <li> <details> <summary> Data </summary> <ul> <li> ${this.data} </li> </ul> </details> </li> </ul>`
        ];
    }
}

class ICMPEchoReply extends ICMPMessage {

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
        return `Echo Reply, Identifier: ${this.identifier}, Sequence: ${this.sequenceNum}`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            "Type: Echo Reply (0)",
            `Identifier: ${this.identifier}`,
            `Sequence: ${this.sequenceNum}`,
            `Checksum: (0x${this.checksum.toString(16)})`,
			`<ul> <li> <details> <summary> Data </summary> <ul> <li> ${this.data} </li> </ul> </details> </li> </ul>`
        ];
    }
}

class ICMPTimestamp extends ICMPMessage {
    get originateTimestamp() {
        return this.packet.getUint32(4);
    }

    get receiveTimestamp() {
        return this.packet.getUint32(8);
    }

    get transmitTimestamp() {
        return this.packet.getUint32(12);
    }

    get toString() {
        return `Timestamp: Originate: ${this.originateTimestamp}, Receive: ${this.receiveTimestamp}, Transmit: ${this.transmitTimestamp}`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            `Type: Timestamp (${this.type})`,
            `Originate Timestamp: ${this.originateTimestamp}`,
            `Receive Timestamp: ${this.receiveTimestamp}`,
            `Transmit Timestamp: ${this.transmitTimestamp}`,
            `Checksum: (0x${this.checksum.toString(16)})`
        ];
    }
}

class ICMPTimestampReply extends ICMPTimestamp {
    get toString() {
        return `Timestamp Reply: Originate: ${this.originateTimestamp}, Receive: ${this.receiveTimestamp}, Transmit: ${this.transmitTimestamp}`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            `Type: Timestamp Reply (${this.type})`,
            `Originate Timestamp: ${this.originateTimestamp}`,
            `Receive Timestamp: ${this.receiveTimestamp}`,
            `Transmit Timestamp: ${this.transmitTimestamp}`,
            `Checksum: (0x${this.checksum.toString(16)})`
        ];
    }
}

class ICMPInformationRequest extends ICMPMessage {
    get toString() {
        return `Information Request`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            `Type: Information Request (${this.type})`,
            `Code: (${this.code})`,
            `Checksum: (0x${this.checksum.toString(16)})`
        ];
    }
}

class ICMPInformationReply extends ICMPMessage {
    get toString() {
        return `Information Reply`;
    }

    get getProperties() {
        return [
            "Internet Control Message Protocol",
            `Type: Information Reply (${this.type})`,
            `Code: (${this.code})`,
            `Checksum: (0x${this.checksum.toString(16)})`
        ];
    }
}
