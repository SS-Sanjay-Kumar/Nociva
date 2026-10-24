import type { Medication } from '../types'

/**
 * DEMONSTRATION FIXTURE — illustrative medication list with real public
 * SMILES structures (from PubChem) for compounds commonly discussed in
 * CYP2D6 pharmacogenomics literature. Used to exercise the Molecular
 * Explorer module end-to-end.
 */
export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: 'med-codeine',
    name: 'Codeine',
    rxnormId: '2670',
    smiles: 'CN1CCC23c4c5ccc(O)c4OC2C(O)C=CC3C1C5',
    drugClass: 'Opioid analgesic',
  },
  {
    id: 'med-fluoxetine',
    name: 'Fluoxetine',
    rxnormId: '4493',
    smiles: 'CNCCC(Oc1ccc(cc1)C(F)(F)F)c1ccccc1',
    drugClass: 'SSRI antidepressant',
  },
  {
    id: 'med-tamoxifen',
    name: 'Tamoxifen',
    rxnormId: '10324',
    smiles: 'CC/C(=C(\\c1ccccc1)/c1ccc(cc1)OCCN(C)C)/c1ccccc1',
    drugClass: 'Selective estrogen receptor modulator',
  },
  {
    id: 'med-metoprolol',
    name: 'Metoprolol',
    rxnormId: '6918',
    smiles: 'COCCc1ccc(cc1)OCC(O)CNC(C)C',
    drugClass: 'Beta blocker',
  },
  {
    id: 'med-omeprazole',
    name: 'Omeprazole',
    rxnormId: '7646',
    smiles: 'CC1=CN=C(C(=C1OC)C)CS(=O)c1nc2ccc(OC)cc2[nH]1',
    drugClass: 'Proton pump inhibitor',
  },
  {
    id: 'med-paracetamol',
    name: 'Paracetamol (Acetaminophen)',
    rxnormId: '161',
    smiles: 'CC(=O)Nc1ccc(O)cc1',
    drugClass: 'Analgesic / antipyretic',
  },
]
