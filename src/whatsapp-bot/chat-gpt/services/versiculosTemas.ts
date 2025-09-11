export default class VersiculosTemas {
  static temas = [
    { id: 1, nombre: 'Amor de Dios' },
    { id: 2, nombre: 'Fe y confianza' },
    { id: 3, nombre: 'Esperanza' },
    { id: 4, nombre: 'Fortaleza en la prueba' },
    { id: 5, nombre: 'Paz' },
    { id: 6, nombre: 'Gozo y alegría' },
    { id: 7, nombre: 'Gratitud' },
    { id: 8, nombre: 'Oración' },
    { id: 9, nombre: 'Sabiduría' },
    { id: 10, nombre: 'Misericordia y gracia' },
    { id: 11, nombre: 'Perdón' },
    { id: 12, nombre: 'Protección de Dios' },
    { id: 13, nombre: 'Humildad' },
    { id: 14, nombre: 'Unidad y amor fraternal' },
    { id: 15, nombre: 'Servicio y ayuda al prójimo' },
    { id: 16, nombre: 'Justicia' },
    { id: 17, nombre: 'Paciencia' },
    { id: 18, nombre: 'Consuelo en la aflicción' },
    { id: 19, nombre: 'Fidelidad de Dios' },
    { id: 20, nombre: 'Vida eterna' },
    { id: 21, nombre: 'Arrepentimiento' },
    { id: 22, nombre: 'Salvación' },
    { id: 23, nombre: 'Jesús como el buen pastor' },
    { id: 24, nombre: 'El Espíritu Santo' },
    { id: 25, nombre: 'La cruz y redención' },
    { id: 26, nombre: 'La resurrección' },
    { id: 27, nombre: 'El amor al prójimo' },
    { id: 28, nombre: 'La creación de Dios' },
    { id: 29, nombre: 'La segunda venida de Cristo' },
    { id: 30, nombre: 'El Reino de Dios' },
    { id: 31, nombre: 'Adoración' },
    { id: 32, nombre: 'La familia' },
    { id: 33, nombre: 'El matrimonio' },
    { id: 34, nombre: 'La iglesia' },

  ];

  static escogerTemaAleatorio() {
    const temas = this.temas;
    const indice = Math.floor(Math.random() * temas.length);
    return temas[indice];
  }
}
