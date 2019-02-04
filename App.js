import React, {Component} from 'react';
import {StyleSheet, FlatList, Text, TextInput, Button, View, Alert, Modal,
        TouchableHighlight, TouchableOpacity} from 'react-native';
import dateFormat from 'dateformat';

const Realm = require('realm');

const boards = {
  name: 'boards',
  primaryKey: 'brdno',
  deleteRealmIfMigrationNeeded:true,
  properties: {
    brdno: 'int',
    brdtitle: 'string',
    brdwriter: 'string',
    brdcontents: 'string',
    brddate: 'date'
  }
};

let realm = new Realm({
  schema: [boards],
  path: 'boardRealm.realm',
  schemaVersion: 2
});  

export default class App extends Component {
  state = {
    maxNo: 3,
    boards: [],
    selectedBoard: {},
    modalVisible: false,
  }

  constructor() {
    super();
  }
  componentWillMount() {
    let maxNo = 1;
    let boards = realm.objects('boards').sorted('brdno', true);
    if (boards.length>0) maxNo = boards[0].brdno+1;
    this.setState({boards: boards, maxNo:maxNo });
  }

  handleSave = () => {
    const { selectedBoard } = this.state;

    if (!selectedBoard.brdno) { // new : Insert
      realm.write(() => {
        realm.create('boards', {...selectedBoard, brdno: this.state.maxNo, brddate: new Date()});
      })  
      this.setState({maxNo: this.state.maxNo+1});    
    }else {                     // update
      realm.write(() => {
        realm.create('boards', {brdno: selectedBoard.brdno, brdwriter: selectedBoard.brdwriter, brdtitle: selectedBoard.brdtitle, brdcontents: selectedBoard.brdcontents }, true);
      });
    }
    this.setState({boards: realm.objects('boards').sorted('brdno', true), selectedBoard: {brdno: null} });
    this.setModalVisible(false);
  }

  handleRowClick = (item) => {
    this.setState({selectedBoard: item});
    this.setModalVisible(true);
  }

  handleDelete = (brdno) => {
    Alert.alert(
      'Board delete',
      'Are you sure you want to delete?',
      [
        {text: 'Cancel'},
        {text: 'OK', onPress: () => this.realDelete(brdno)    },
      ],
      { cancelable: false }
    )
  }
  realDelete = (brdno) => {
    realm.write(() => {
      let boards = realm.objects('boards');
      let board = boards.filtered('brdno = "' + brdno + '"');
      realm.delete(board);
      this.setState({boards: realm.objects('boards').sorted('brdno', true), selectedBoard: {brdno: null} });
    });
  }

  setModalVisible(visible) {
    this.setState({modalVisible: visible});
  }

  render() {
    const { boards, selectedBoard } = this.state;
 
    return (
      <View style={styles.container}>
        <View style={styles.appTitle}> 
          <Text style={styles.appText}>Realm Boards</Text>
        </View>      
        <View style={{width: 100}}>
          <Button title="New" onPress={()=>{this.setModalVisible(true);}}/>
        </View>      
        <FlatList
          data={boards}
          renderItem={({item}) =>
            <TouchableHighlight onPress={() => this.handleRowClick(item)}>
              <View style={styles.listRow}>
                <View style={styles.item5} ><Text numberOfLines={1} ellipsizeMode='tail'>{item.brdtitle}</Text></View>
                <View style={styles.item2}><Text>{item.brdwriter}</Text></View>
                <View style={styles.item3}><Text>{dateFormat(item.brddate, "yyyy-mm-dd")}</Text></View>
                <View style={styles.item1}>
                  <TouchableOpacity onPress={() => this.handleDelete(item.brdno)}>
                    <Text>X</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableHighlight>
          }
          keyExtractor={item => item.brdno.toString()}
        />
        <Modal animationType="slide" transparent={false} visible={this.state.modalVisible} onRequestClose={() => {}}>
          <View style={{marginTop: 22}}>
            <View>
              <Text>Write a post</Text>
              <TextInput name="brdwriter" value={selectedBoard.brdwriter} onChangeText={brdwriter => this.setState({ selectedBoard: {...selectedBoard, brdwriter} })} placeholder="Name" style={styles.input}/>
              <TextInput name="brdtitle" value={selectedBoard.brdtitle} onChangeText={brdtitle => this.setState({ selectedBoard: {...selectedBoard, brdtitle} })} placeholder="Title" style={styles.input}/>
              <TextInput name="brdcontents" value={selectedBoard.brdcontents} onChangeText={brdcontents => this.setState({ selectedBoard: {...selectedBoard, brdcontents} })} placeholder="Contents" 
                  multiline = {true} editable = {true} underlineColorAndroid = "transparent" style={styles.inputArea}/>

              <View style={styles.listRow}>              
                <Button style={styles.item2} title="Save" onPress={this.handleSave}/>
                <Button style={styles.item2} title="Close" onPress={() => { this.setModalVisible(false); }}/>
              </View>
            </View>
          </View>
        </Modal>        
      </View>  
    );
  }
}

const styles = StyleSheet.create({
  appTitle: {
    justifyContent: 'center',
    alignItems: 'center',
  },  
  appText: {
    color: 'black',
    fontSize: 30,
    fontFamily: 'bold',
  },
  listRow: {
    flexDirection: 'row',
  },
  item1: {
    flex: 0.05,
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'black',    
  },  
  item2: {
    flex: 0.2,
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'black',    
  },
  item3: {
    flex: 0.3,
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'black',    
  },
  item5: {
    flex: 0.5,
    padding: 10,
    borderWidth: 1,
  },
  input: {
    textAlignVertical: 'top',
    margin: 10,
    borderColor: '#7a42f4',
    borderWidth: 1,
    height: 40,
  },
  inputArea: {
    textAlignVertical: 'top',
    margin: 10,
    borderColor: '#7a42f4',
    borderWidth: 1,
    height: 100,
  },
});
