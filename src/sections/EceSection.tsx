import React, { useState } from 'react';
import { Cpu, Layers, Terminal, Radio, Binary, ExternalLink, Zap } from 'lucide-react';
import { useReveal } from '../hooks/useReveal';
import { GithubIcon } from '../components/BrandIcons';
import './EceSection.css';

type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

interface VerilogSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
}

const VERILOG_SNIPPETS: VerilogSnippet[] = [
  {
    id: 'mux2',
    title: '2-to-1 Multiplexer',
    description: 'Combinational multiplexer using continuous assignment to steer input data based on select line.',
    code: `// 2-to-1 Multiplexer in Verilog HDL
module mux_2to1 (
    input  wire a,       // Data Input 0
    input  wire b,       // Data Input 1
    input  wire sel,     // Select Line
    output wire y        // Selected Output
);
    // Continuous assignment using ternary multiplexer logic
    assign y = sel ? b : a;

endmodule`,
  },
  {
    id: 'fulladder',
    title: '1-Bit Full Adder',
    description: 'Fundamental building block of digital ALUs incorporating two operand bits and carry-in.',
    code: `// 1-Bit Full Adder
module full_adder (
    input  wire a,
    input  wire b,
    input  wire cin,
    output wire sum,
    output wire cout
);
    // Sum is XOR of all inputs
    assign sum  = a ^ b ^ cin;
    // Carry-out generated when at least two inputs are HIGH
    assign cout = (a & b) | (cin & (a ^ b));

endmodule`,
  },
  {
    id: 'dff',
    title: 'D Flip-Flop with Async Reset',
    description: 'Edge-triggered sequential storage element with active-low asynchronous reset.',
    code: `// D Flip-Flop with Active-Low Asynchronous Reset
module d_flip_flop (
    input  wire clk,     // Clock Signal
    input  wire rst_n,   // Active-low Asynchronous Reset
    input  wire d,       // Data Input
    output reg  q        // Registered Output
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            q <= 1'b0;   // Reset state
        end else begin
            q <= d;      // Sample data on rising clock edge
        end
    end

endmodule`,
  },
  {
    id: 'counter',
    title: '4-Bit Synchronous Counter',
    description: 'Synchronous 4-bit binary up-counter with synchronous enable and active-high synchronous reset.',
    code: `// 4-Bit Synchronous Binary Up-Counter
module counter_4bit (
    input  wire       clk,
    input  wire       rst,
    input  wire       en,
    output reg  [3:0] count
);
    always @(posedge clk) begin
        if (rst) begin
            count <= 4'b0000;
        end else if (en) begin
            count <= count + 1'b1;
        end
    end

endmodule`,
  },
  {
    id: 'fsm',
    title: '2-State FSM (Sequence Detector)',
    description: 'Synchronous Moore Finite State Machine transitioning across state registers on clock edges.',
    code: `// 2-State Moore Finite State Machine
module fsm_moore (
    input  wire clk,
    input  wire rst_n,
    input  wire din,
    output reg  dout
);
    localparam IDLE = 1'b0, ACTIVE = 1'b1;
    reg state, next_state;

    // State register
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) state <= IDLE;
        else        state <= next_state;
    end

    // Next-state logic & output decoding
    always @(*) begin
        case (state)
            IDLE:   next_state = din ? ACTIVE : IDLE;
            ACTIVE: next_state = din ? ACTIVE : IDLE;
            default: next_state = IDLE;
        endcase
        dout = (state == ACTIVE);
    end

endmodule`,
  },
];

const VLSI_FLOW_STEPS = [
  {
    step: '01',
    title: 'Architecture & Spec',
    desc: 'Functional specification, performance budgets, power envelopes, and microarchitectural block partitioning.',
  },
  {
    step: '02',
    title: 'RTL Modeling',
    desc: 'Hardware description in Verilog/SystemVerilog defining registers, state machines, and datapath logic.',
  },
  {
    step: '03',
    title: 'Verification',
    desc: 'Testbench generation, cycle-accurate simulation, corner-case analysis, and code/functional coverage closure.',
  },
  {
    step: '04',
    title: 'Logic Synthesis',
    desc: 'Translating RTL into target technology gate-level netlists with timing constraints (SDC) and cell mapping.',
  },
  {
    step: '05',
    title: 'Physical Design & Tapeout',
    desc: 'Floorplanning, placement, clock tree synthesis (CTS), routing, DRC/LVS physical signoff, and GDSII generation.',
  },
];

export const EceSection: React.FC = () => {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.05 });

  // Interactive Logic Gate Simulator State
  const [activeGate, setActiveGate] = useState<GateType>('AND');
  const [inputA, setInputA] = useState<number>(1);
  const [inputB, setInputB] = useState<number>(0);

  // Radix Converter State
  const [decVal, setDecVal] = useState<number>(42);

  // Active Verilog Snippet
  const [activeSnippetId, setActiveSnippetId] = useState<string>('mux2');

  // Active VLSI Step
  const [activeVlsiStep, setActiveVlsiStep] = useState<number>(1);

  // Compute logic gate output
  const computeGateOutput = (gate: GateType, a: number, b: number): number => {
    switch (gate) {
      case 'AND': return (a && b) ? 1 : 0;
      case 'OR': return (a || b) ? 1 : 0;
      case 'NOT': return a ? 0 : 1;
      case 'NAND': return !(a && b) ? 1 : 0;
      case 'NOR': return !(a || b) ? 1 : 0;
      case 'XOR': return (a ^ b) ? 1 : 0;
      case 'XNOR': return (a === b) ? 1 : 0;
      default: return 0;
    }
  };

  const gateOutput = computeGateOutput(activeGate, inputA, inputB);

  // Truth table generator
  const getTruthTableRows = (gate: GateType) => {
    if (gate === 'NOT') {
      return [
        { a: 0, b: '-', out: 1 },
        { a: 1, b: '-', out: 0 },
      ];
    }
    return [
      { a: 0, b: 0, out: computeGateOutput(gate, 0, 0) },
      { a: 0, b: 1, out: computeGateOutput(gate, 0, 1) },
      { a: 1, b: 0, out: computeGateOutput(gate, 1, 0) },
      { a: 1, b: 1, out: computeGateOutput(gate, 1, 1) },
    ];
  };

  const activeSnippet = VERILOG_SNIPPETS.find(s => s.id === activeSnippetId) || VERILOG_SNIPPETS[0];

  return (
    <section id="ece" className="ece-section" aria-labelledby="ece-title">
      <div className="ece-blueprint-bg" aria-hidden="true" />

      <div className="container" ref={ref}>
        {/* Section Header */}
        <div className={`ece-header ${isVisible ? 'revealed' : ''}`}>
          <div className="ece-badge">
            <Cpu size={14} />
            <span>Digital Hardware &amp; Silicon Architecture</span>
          </div>
          <h2 className="section-title" id="ece-title">
            Electronics &amp; <span className="text-gradient">Communication Engineering</span>
          </h2>
          <p className="section-subtitle">
            Exploring the fundamentals of digital systems, semiconductor technology, and intelligent hardware.
          </p>
        </div>

        {/* Engineering Core Pillars */}
        <div className={`ece-overview-grid ${isVisible ? 'revealed' : ''}`}>
          <div className="ece-overview-card">
            <div className="ece-card-icon">
              <Cpu size={22} />
            </div>
            <h3 className="ece-card-title">Digital Logic &amp; Electronics</h3>
            <p className="ece-card-desc">
              Strong foundation in Boolean algebra, combinational networks (encoders, multiplexers, ALUs), and sequential state machines. Understanding how silicon executes arithmetic operations.
            </p>
          </div>

          <div className="ece-overview-card">
            <div className="ece-card-icon">
              <Layers size={22} />
            </div>
            <h3 className="ece-card-title">VLSI &amp; Semiconductor Design</h3>
            <p className="ece-card-desc">
              Exploring CMOS inverter fundamentals, MOSFET switching characteristics, standard cell libraries, and the digital ASIC/FPGA synthesis design flow from RTL specification to layout.
            </p>
          </div>

          <div className="ece-overview-card">
            <div className="ece-card-icon">
              <Radio size={22} />
            </div>
            <h3 className="ece-card-title">Embedded Systems &amp; Telemetry</h3>
            <p className="ece-card-desc">
              Microcontroller firmware, hardware abstraction, and serial communication protocols (UART, SPI, I2C). Bridging embedded hardware sensors with real-time software dashboards.
            </p>
          </div>
        </div>

        {/* 1. Interactive Digital Logic Laboratory */}
        <div className="ece-lab-box">
          <div className="ece-lab-header">
            <div className="ece-lab-title">
              <Zap size={20} />
              <span>Interactive Digital Logic Simulator</span>
            </div>

            <div className="ece-lab-selector" role="group" aria-label="Select logic gate">
              {(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'] as GateType[]).map(g => (
                <button
                  key={g}
                  type="button"
                  className={`ece-gate-btn ${activeGate === g ? 'active' : ''}`}
                  onClick={() => setActiveGate(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="ece-simulator-grid">
            {/* Left: Interactive Circuit Visualization */}
            <div className="ece-circuit-canvas">
              <div className="ece-gate-graphic-wrap">
                {/* Inputs Column */}
                <div className="ece-inputs-column">
                  <button
                    type="button"
                    className="ece-input-toggle"
                    onClick={() => setInputA(a => (a === 1 ? 0 : 1))}
                    title="Click to toggle Input A"
                  >
                    <span>Input A</span>
                    <span className={`ece-bit-val ${inputA === 1 ? 'high' : ''}`}>{inputA}</span>
                  </button>

                  {activeGate !== 'NOT' && (
                    <button
                      type="button"
                      className="ece-input-toggle"
                      onClick={() => setInputB(b => (b === 1 ? 0 : 1))}
                      title="Click to toggle Input B"
                    >
                      <span>Input B</span>
                      <span className={`ece-bit-val ${inputB === 1 ? 'high' : ''}`}>{inputB}</span>
                    </button>
                  )}
                </div>

                {/* Gate SVG Icon Rendering */}
                <div className="ece-gate-svg-box">
                  <svg width="100" height="70" viewBox="0 0 100 70" fill="none">
                    {/* Wires */}
                    <line x1="0" y1="20" x2="30" y2="20" stroke={inputA ? 'var(--accent-blue)' : '#475569'} strokeWidth="2.5" />
                    {activeGate !== 'NOT' && (
                      <line x1="0" y1="50" x2="30" y2="50" stroke={inputB ? 'var(--accent-blue)' : '#475569'} strokeWidth="2.5" />
                    )}
                    <line x1="75" y1="35" x2="100" y2="35" stroke={gateOutput ? '#22c55e' : '#475569'} strokeWidth="2.5" />

                    {/* Gate Symbol */}
                    {activeGate === 'AND' && (
                      <path d="M30 10 H50 A25 25 0 0 1 50 60 H30 Z" stroke="var(--accent-blue)" strokeWidth="2.5" fill="rgba(56, 189, 248, 0.1)" />
                    )}
                    {activeGate === 'OR' && (
                      <path d="M30 10 Q45 35 30 60 Q65 60 75 35 Q65 10 30 10 Z" stroke="var(--accent-blue)" strokeWidth="2.5" fill="rgba(56, 189, 248, 0.1)" />
                    )}
                    {activeGate === 'NOT' && (
                      <>
                        <polygon points="30,10 65,35 30,60" stroke="var(--accent-blue)" strokeWidth="2.5" fill="rgba(56, 189, 248, 0.1)" />
                        <circle cx="70" cy="35" r="4" stroke="var(--accent-blue)" strokeWidth="2" fill="#06080c" />
                      </>
                    )}
                    {activeGate === 'NAND' && (
                      <>
                        <path d="M30 10 H50 A25 25 0 0 1 50 60 H30 Z" stroke="var(--accent-blue)" strokeWidth="2.5" fill="rgba(56, 189, 248, 0.1)" />
                        <circle cx="78" cy="35" r="4" stroke="var(--accent-blue)" strokeWidth="2" fill="#06080c" />
                      </>
                    )}
                    {activeGate === 'NOR' && (
                      <>
                        <path d="M28 10 Q43 35 28 60 Q63 60 72 35 Q63 10 28 10 Z" stroke="var(--accent-blue)" strokeWidth="2.5" fill="rgba(56, 189, 248, 0.1)" />
                        <circle cx="77" cy="35" r="4" stroke="var(--accent-blue)" strokeWidth="2" fill="#06080c" />
                      </>
                    )}
                    {activeGate === 'XOR' && (
                      <>
                        <path d="M23 10 Q38 35 23 60" stroke="var(--accent-blue)" strokeWidth="2" fill="none" />
                        <path d="M30 10 Q45 35 30 60 Q65 60 75 35 Q65 10 30 10 Z" stroke="var(--accent-blue)" strokeWidth="2.5" fill="rgba(56, 189, 248, 0.1)" />
                      </>
                    )}
                    {activeGate === 'XNOR' && (
                      <>
                        <path d="M23 10 Q38 35 23 60" stroke="var(--accent-blue)" strokeWidth="2" fill="none" />
                        <path d="M29 10 Q44 35 29 60 Q64 60 73 35 Q64 10 29 10 Z" stroke="var(--accent-blue)" strokeWidth="2.5" fill="rgba(56, 189, 248, 0.1)" />
                        <circle cx="78" cy="35" r="4" stroke="var(--accent-blue)" strokeWidth="2" fill="#06080c" />
                      </>
                    )}
                  </svg>
                </div>

                {/* Output Indicator */}
                <div className="ece-output-box">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Output Y</span>
                  <div className={`ece-output-indicator ${gateOutput === 1 ? 'high' : ''}`}>
                    {gateOutput}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-faint)', fontFamily: 'JetBrains Mono' }}>
                &gt; Logic Output: Y = {gateOutput === 1 ? 'HIGH (Logic 1)' : 'LOW (Logic 0)'}
              </div>
            </div>

            {/* Right: Truth Table with Active Row Highlight */}
            <div className="ece-truth-table-wrap">
              <table className="ece-truth-table" aria-label={`Truth table for ${activeGate} gate`}>
                <thead>
                  <tr>
                    <th>Input A</th>
                    {activeGate !== 'NOT' && <th>Input B</th>}
                    <th>Output Y</th>
                  </tr>
                </thead>
                <tbody>
                  {getTruthTableRows(activeGate).map((row, idx) => {
                    const isSelected = activeGate === 'NOT'
                      ? row.a === inputA
                      : row.a === inputA && row.b === inputB;
                    return (
                      <tr key={idx} className={isSelected ? 'active-row' : ''}>
                        <td>{row.a}</td>
                        {activeGate !== 'NOT' && <td>{row.b}</td>}
                        <td>{row.out}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radix / Number Systems Live Converter */}
          <div className="ece-converter-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.9rem' }}>
              <Binary size={16} />
              <span>Digital Number Systems &amp; Radix Conversion</span>
            </div>
            <div className="ece-converter-inputs">
              <div className="ece-conv-field">
                <label className="ece-conv-label">Decimal (Base 10)</label>
                <input
                  type="number"
                  className="ece-conv-input"
                  value={isNaN(decVal) ? '' : decVal}
                  onChange={e => setDecVal(parseInt(e.target.value, 10))}
                  min="-128"
                  max="255"
                />
              </div>

              <div className="ece-conv-field">
                <label className="ece-conv-label">Binary (Base 2)</label>
                <div className="ece-conv-input" style={{ background: '#0a0d14' }}>
                  {!isNaN(decVal) ? (decVal >>> 0).toString(2).padStart(8, '0').slice(-8) : '00000000'}
                </div>
              </div>

              <div className="ece-conv-field">
                <label className="ece-conv-label">Hexadecimal (Base 16)</label>
                <div className="ece-conv-input" style={{ background: '#0a0d14' }}>
                  {!isNaN(decVal) ? '0x' + (decVal >>> 0).toString(16).toUpperCase().padStart(2, '0').slice(-2) : '0x00'}
                </div>
              </div>

              <div className="ece-conv-field">
                <label className="ece-conv-label">Two&apos;s Complement (8-bit)</label>
                <div className="ece-conv-input" style={{ background: '#0a0d14' }}>
                  {!isNaN(decVal) ? ((decVal < 0 ? 256 + decVal : decVal) & 0xff).toString(2).padStart(8, '0') : '00000000'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. VLSI & Semiconductor Design Workflow */}
        <div style={{ margin: '4rem 0 2rem' }}>
          <div className="section-label" style={{ textAlign: 'center' }}>Silicon Engineering</div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            VLSI Digital IC Design Flow
          </h3>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '650px', margin: '0 auto 2.5rem' }}>
            The industry-standard ASIC and FPGA digital synthesis pipeline transforming functional specifications into verified silicon layouts.
          </p>

          <div className="ece-vlsi-flow" role="tablist">
            {VLSI_FLOW_STEPS.map((step, idx) => (
              <div
                key={step.step}
                className={`ece-flow-step ${activeVlsiStep === idx ? 'active' : ''}`}
                onClick={() => setActiveVlsiStep(idx)}
                role="tab"
                tabIndex={0}
              >
                <div className="ece-flow-step-num">STAGE {step.step}</div>
                <div className="ece-flow-step-title">{step.title}</div>
                <div className="ece-flow-step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Verilog HDL & RTL Design Modules */}
        <div className="ece-code-section">
          <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={17} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Verilog HDL Hardware Description Examples
            </span>
          </div>

          <div className="ece-code-tabs">
            {VERILOG_SNIPPETS.map(snip => (
              <button
                key={snip.id}
                type="button"
                className={`ece-code-tab ${activeSnippetId === snip.id ? 'active' : ''}`}
                onClick={() => setActiveSnippetId(snip.id)}
              >
                {snip.title}
              </button>
            ))}
          </div>

          <div className="ece-code-body">
            <div className="ece-code-explanation">
              <strong>Architecture Note: </strong>{activeSnippet.description}
            </div>
            <pre className="ece-pre">
              <code>{activeSnippet.code}</code>
            </pre>
          </div>
        </div>

        {/* 4. Embedded Systems & Serial Communication Protocols */}
        <div style={{ marginTop: '4rem' }}>
          <div className="section-label">Hardware-Software Boundary</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Embedded Communication Protocols
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Standard industrial serial protocols used for microcontroller-to-sensor telemetry and inter-chip communication.
          </p>

          <div className="ece-protocols-grid">
            <div className="ece-protocol-card">
              <span className="ece-proto-badge">Point-to-Point</span>
              <h4 className="ece-proto-title">UART</h4>
              <div className="ece-proto-meta">2 Wires (Tx, Rx) • Asynchronous</div>
              <p className="ece-proto-desc">
                Universal Asynchronous Receiver-Transmitter. Full-duplex communication using predefined baud rates, start/stop framing bits, and parity checking. Ideal for debugging logs and serial modems.
              </p>
            </div>

            <div className="ece-protocol-card">
              <span className="ece-proto-badge">High-Speed Master/Slave</span>
              <h4 className="ece-proto-title">SPI</h4>
              <div className="ece-proto-meta">4 Wires (MOSI, MISO, SCK, CS) • Sync</div>
              <p className="ece-proto-desc">
                Serial Peripheral Interface. High-throughput synchronous bus capable of 10+ MHz clock rates for fast peripherals, memory chips, TFT displays, and SD cards.
              </p>
            </div>

            <div className="ece-protocol-card">
              <span className="ece-proto-badge">Multi-Drop Addressable</span>
              <h4 className="ece-proto-title">I2C</h4>
              <div className="ece-proto-meta">2 Wires (SDA, SCL) • Synchronous</div>
              <p className="ece-proto-desc">
                Inter-Integrated Circuit. Multi-device bus using 7-bit or 10-bit addressing with open-drain pull-ups. Efficient for wiring dozens of sensors (IMUs, temperature, pressure) using only two lines.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Real Academic & Learning Projects in ECE */}
        <div style={{ marginTop: '4rem' }}>
          <div className="section-label">Applied Hardware Projects</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ECE Project &amp; Simulation Evidence
          </h3>
          <div className="ece-projects-grid">
            <div className="ece-project-item">
              <div>
                <div className="ece-project-tag">Radix &amp; Unit Engine</div>
                <h4 className="ece-project-title">CONVET PULSE — Engineering Converter</h4>
                <p className="ece-project-desc">
                  An engineering conversion utility designed for electronics and computer science students. Performs radix conversions (binary, octal, hex, two&apos;s complement), RF signal wavelength transformations, and data rate math.
                </p>
              </div>
              <div className="ece-project-footer">
                <span className="chip chip-cyan">HTML5 / JavaScript / Math</span>
                <a
                  href="https://github.com/sridharvpr7/CONVETER.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  aria-label="View CONVETER repository"
                >
                  <GithubIcon size={14} /> Repository
                </a>
              </div>
            </div>

            <div className="ece-project-item">
              <div>
                <div className="ece-project-tag">Digital Logic Verification</div>
                <h4 className="ece-project-title">RTL Digital Design Simulation Modules</h4>
                <p className="ece-project-desc">
                  Academic Verilog modules encompassing combinational adders, multiplexers, and synchronous finite state machines verified using testbenches and cycle-accurate waveform simulations.
                </p>
              </div>
              <div className="ece-project-footer">
                <span className="chip">Verilog HDL / ModelSim</span>
                <a
                  href="https://github.com/sridharvpr7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  aria-label="View GitHub profile"
                >
                  <ExternalLink size={14} /> Codec Technologies Internship
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
