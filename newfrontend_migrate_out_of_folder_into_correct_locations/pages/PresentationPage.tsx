import img1 from "figma:asset/1aade9da2ead77caa1f50f451744dc7e40e999b7.png";
import img2 from "figma:asset/6df4822a9b6c0b1bf860ab161c42b62aa2d35fdc.png";
import img3 from "figma:asset/e20101715f76524707ad2e3064220dea9194ae59.png";
import img4 from "figma:asset/8407742ec77ce4eaf70dc713994e698bf8fdde09.png";
import img5 from "figma:asset/c53f866db31c6447aac5fb5080a360af1f93b873.png";
import img6 from "figma:asset/c38bea6ae2ec78a1432ff8ddab1d4bb2e96b2de4.png";
import img7 from "figma:asset/7ce21665fde443d83b91fd59300cf9a6db89a0e1.png";
import img8 from "figma:asset/67687fe0be9efd8c073cea15fe76bf27f7813e77.png";
import img9 from "figma:asset/4dcaa272a69d1d97c6ca834ce9212694836c5753.png";
import img10 from "figma:asset/ff5b3dc72af02bfe88f70690cda1721d3f459c92.png";
import img11 from "figma:asset/4ed2649608ebcbfd8859b1f3bcd2d2f6f1619a28.png";
import img13 from "figma:asset/5c2f81ef64c8e08924725bf57abddd5ddefc7bc6.png";
import img14 from "figma:asset/cf822b9cc298132156fc272d5b3cc04d5c93eaef.png";
import img15 from "figma:asset/57f113da3f768991c7162659ddc1b4978d791733.png";
import img16 from "figma:asset/4f52b57d06d3da24a2345efa009776bed2d69659.png";
import img17 from "figma:asset/2a31f709dcfe942f5a26d6d7a9c6cdb4777ae4b9.png";
import img18 from "figma:asset/e1f03fbfc52d5cea187ce92735897b6cbbb3967e.png";
import img19 from "figma:asset/960068090b0304c672b5ca3be1bed05e5dc34772.png";
import img20 from "figma:asset/70759020e523ba5bebf2c97ee0e6b6c454a395f6.png";
import img21 from "figma:asset/bfbf5dabbc3f34b5c566edd59ec12ffa90606dcf.png";
import img22 from "figma:asset/3a2ccad9d42ae7da328e38705598770baa2b35e0.png";
import img23 from "figma:asset/4c08cf01f9aba739d2621f64f886f3dc6ec021a4.png";
import img24 from "figma:asset/348515e3b550bc2070fed95c34266a0e274b8713.png";
import img25 from "figma:asset/5d6f3a74bff30f9d6f7e64c0fc7e9dfd7ce81b29.png";
import img26 from "figma:asset/096f2dff59c12097656b735aff64b0de35a6fe10.png";
import img27 from "figma:asset/b75fab3ac6f6d21006cffbcd25c62e6b2547b8d8.png";
import logoImg from "figma:asset/94100a37ef17fa8f369bbf0340e5fc81e46c3306.png";

export function PresentationPage() {
  return (
    <div style={{
      position: 'absolute',
      height: '100%',
      width: '100%',
      overflow: 'auto',
      margin: 0,
      backgroundColor: '#000',
      fontFamily: 'Arial, sans-serif',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        background: '#1a2740',
        padding: '12px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ fontSize: '18px' }}>
          JOSOOR – Solution Product Architecture
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '14px' }}>
            Status: <span style={{ color: '#0f0', fontWeight: 'bold' }}>ON</span>
          </div>
          <img src={logoImg} alt="Logo" style={{ height: '35px', width: 'auto' }} />
        </div>
      </div>

      {/* Command line section */}
      <div style={{
        background: '#000',
        color: '#0f0',
        padding: '12px 30px',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        borderBottom: '1px solid #222',
        display: 'grid',
        gridTemplateColumns: '300px 220px 250px 150px',
        gap: '20px'
      }}>
        <div>root {'>'} $ npm run release_notes</div>
        <div>{'>'} 1.0 mvp_system<br/>{'>'} 1.5 super_mvp_system</div>
        <div>operational demo on demand<br/>development - trial saas</div>
        <div>Nov 2025<br/>Jan 2026</div>
      </div>

      {/* Main Architecture Diagram */}
      <div style={{ padding: '20px', position: 'relative' }}>
        {/* Row 1: Government Entity + Agentic Ecosystem */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          {/* Government Entity */}
          <div style={{
            background: 'linear-gradient(135deg, #0d3d0d, #1a5a1a)',
            padding: '20px',
            borderRadius: '4px',
            border: '2px solid #2d5d2d',
            width: '550px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 'bold' }}>
              Government Entity
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'flex-end'
            }}>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <img src={img14} alt="People" style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '10px' }} />
                <div style={{ fontSize: '13px' }}>People</div>
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '30px',
                  background: '#fff'
                }}></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <img src={img15} alt="Processes" style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '10px' }} />
                <div style={{ fontSize: '13px' }}>Processes</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <img src={img1} alt="IT Systems" style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '10px' }} />
                <div style={{ fontSize: '13px' }}>IT Systems</div>
              </div>
            </div>
            {/* Arrow pointing right */}
            <div style={{
              position: 'absolute',
              right: '-30px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '40px',
              color: '#D4AF37'
            }}>→</div>
          </div>

          {/* Agentic Ecosystem */}
          <div style={{
            background: 'linear-gradient(135deg, #4a5060, #5a6070)',
            padding: '20px',
            borderRadius: '4px',
            border: '2px solid #6a7080',
            width: '250px'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              Agentic Ecosystem
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <img src={img24} alt="Feeders" style={{ width: '45px', height: '45px', objectFit: 'contain', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', color: '#ccc' }}>Feeders</div>
              </div>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <img src={img24} alt="Integrators" style={{ width: '45px', height: '45px', objectFit: 'contain', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', color: '#ccc' }}>Integrators</div>
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '30px',
                  background: '#fff'
                }}></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <img src={img24} alt="Manager" style={{ width: '45px', height: '45px', objectFit: 'contain', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', color: '#ccc' }}>Manager</div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Interface Layer + Databases Layer */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          {/* Interface Layer */}
          <div style={{
            background: '#1a2840',
            padding: '20px',
            borderRadius: '4px',
            border: '2px solid #2a3850',
            width: '265px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 'bold' }}>
              Interface Layer
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              gap: '20px'
            }}>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <img src={img6} alt="Web Desktop" style={{ width: '75px', height: '75px', objectFit: 'contain', marginBottom: '10px' }} />
                <div style={{ fontSize: '12px' }}>Web<br/>Desktop</div>
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '30px',
                  background: '#fff'
                }}></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <img src={img5} alt="Mobile App" style={{ width: '75px', height: '75px', objectFit: 'contain', marginBottom: '10px', opacity: 0.5 }} />
                <div style={{ fontSize: '12px', color: '#888' }}>Mobile<br/>App</div>
              </div>
            </div>
          </div>

          {/* Databases Layer */}
          <div style={{
            background: '#1a2840',
            padding: '20px',
            borderRadius: '4px',
            border: '3px solid #D4AF37',
            width: '520px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 'bold' }}>
              Databases Layer
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative'
            }}>
              <div style={{ textAlign: 'center', zIndex: 2 }}>
                <img src={img4} alt="Graph Database" style={{ width: '55px', height: '55px', objectFit: 'contain', marginBottom: '8px' }} />
                <div style={{ fontSize: '10px' }}>Graph<br/>Database</div>
              </div>
              
              <div style={{ textAlign: 'center', zIndex: 2 }}>
                <img src={img16} alt="Vector Embeddings" style={{ width: '55px', height: '55px', objectFit: 'contain', marginBottom: '8px' }} />
                <div style={{ fontSize: '10px' }}>Vector<br/>Embeddings</div>
              </div>
              
              <div style={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
                <img src={img18} alt="Ontology Model" style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '8px' }} />
                <div style={{ fontSize: '10px' }}>Ontology<br/>Model</div>
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '30px',
                  background: '#fff',
                  zIndex: 3
                }}></div>
              </div>
              
              <div style={{ textAlign: 'center', zIndex: 2 }}>
                <img src={img20} alt="Non-Structured" style={{ width: '55px', height: '55px', objectFit: 'contain', marginBottom: '8px' }} />
                <div style={{ fontSize: '10px' }}>Non-<br/>Structured</div>
              </div>
              
              <div style={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
                <img src={img27} alt="Relational SQL" style={{ width: '55px', height: '55px', objectFit: 'contain', marginBottom: '8px' }} />
                <div style={{ fontSize: '10px' }}>Relational<br/>SQL</div>
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '30px',
                  background: '#fff',
                  zIndex: 3
                }}></div>
              </div>

              {/* Connecting arrows */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '10%',
                right: '10%',
                height: '2px',
                background: 'transparent',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                <svg width="100%" height="40" style={{ position: 'absolute', top: '-20px' }}>
                  <line x1="12%" y1="20" x2="28%" y2="20" stroke="#D4AF37" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  <line x1="50%" y1="20" x2="30%" y2="20" stroke="#D4AF37" strokeWidth="2" markerStart="url(#arrowstart)" />
                  <line x1="50%" y1="20" x2="70%" y2="20" stroke="#D4AF37" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  <line x1="88%" y1="20" x2="72%" y2="20" stroke="#D4AF37" strokeWidth="2" markerStart="url(#arrowstart)" />
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#D4AF37" />
                    </marker>
                    <marker id="arrowstart" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
                      <polygon points="10 0, 0 3, 10 6" fill="#D4AF37" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Backend Layer + DTO Knowledge Graph + LLM + MCP Tooling Interface */}
        <div style={{ display: 'flex', gap: '15px' }}>
          {/* Backend Layer */}
          <div style={{
            background: '#1a2840',
            padding: '20px',
            borderRadius: '4px',
            border: '2px solid #2a3850',
            width: '200px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 'bold' }}>
              Backend Layer
            </div>
            
            <div style={{ marginBottom: '25px', textAlign: 'center' }}>
              <img src={img10} alt="Next.js" style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '10px' }} />
              <div style={{ fontSize: '11px' }}>Next.js Web Portal /<br/>GenAI Chat</div>
            </div>

            <div style={{ marginBottom: '25px', textAlign: 'center' }}>
              <img src={img10} alt="Orchestrator" style={{ width: '55px', height: '55px', objectFit: 'contain', marginBottom: '10px' }} />
              <div style={{ fontSize: '11px' }}>Orchestrator<br/>Application</div>
            </div>

            <div style={{ marginBottom: '25px', textAlign: 'center' }}>
              <img src={img22} alt="Orchestrator" style={{ width: '55px', height: '55px', objectFit: 'contain', marginBottom: '10px' }} />
              <div style={{ fontSize: '11px' }}>Orchestrator<br/>Application</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <img src={img7} alt="MCP" style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '10px' }} />
              <div style={{ fontSize: '11px' }}>MCP / Tooling</div>
            </div>

            {/* Arrow pointing right */}
            <div style={{
              position: 'absolute',
              right: '-25px',
              top: '180px',
              fontSize: '30px',
              color: '#fff'
            }}>→</div>
          </div>

          {/* DTO Knowledge Graph */}
          <div style={{
            background: '#0d1d2d',
            padding: '20px',
            borderRadius: '4px',
            border: '2px solid #1d2d3d',
            width: '280px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '15px', fontWeight: 'bold', textAlign: 'center' }}>
              DTO Knowledge Graph
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={img8} alt="DTO Knowledge Graph" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            </div>
            {/* Connecting lines down */}
            <div style={{
              position: 'absolute',
              bottom: '-15px',
              left: '35%',
              width: '2px',
              height: '15px',
              background: '#D4AF37'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-15px',
              left: '50%',
              width: '2px',
              height: '15px',
              background: '#D4AF37'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-15px',
              left: '65%',
              width: '2px',
              height: '15px',
              background: '#D4AF37'
            }}></div>
          </div>

          {/* Large Language Models AI */}
          <div style={{
            background: '#0d1d2d',
            padding: '20px',
            borderRadius: '4px',
            border: '2px solid #1d2d3d',
            width: '280px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={img26} alt="LLM" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginTop: '10px' }}>
              Large Language Models AI
            </div>
            {/* Arrow pointing right */}
            <div style={{
              position: 'absolute',
              right: '-25px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '30px',
              color: '#fff'
            }}>→</div>
          </div>

          {/* MCP Tooling Interface */}
          <div style={{
            background: 'linear-gradient(135deg, #4a5a4a, #5a6a5a)',
            padding: '20px',
            borderRadius: '4px',
            border: '2px solid #6a7a6a',
            width: '250px'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              MCP Tooling Interface
            </div>

            {/* Center of Government */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <img src={img2} alt="COG" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                <img src={img2} alt="COG" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                Center of Government
              </div>
            </div>

            {/* APIs */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={img21} alt="APIs" style={{ width: '50px', height: '50px', objectFit: 'contain', marginBottom: '8px' }} />
              <div style={{ fontSize: '11px' }}>APIs</div>
            </div>

            {/* Sister Entities Grid */}
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                marginBottom: '10px'
              }}>
                {[...Array(18)].map((_, i) => (
                  <div key={i} style={{
                    background: (i === 1 || i === 4 || i === 7 || i === 10 || i === 13 || i === 16) ? '#8B7355' : '#6B5345',
                    padding: '10px',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img src={img17} alt="Entity" style={{ width: '18px', height: '18px', objectFit: 'contain', opacity: 0.7 }} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', textAlign: 'center' }}>
                Sister Entities' Twins
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
