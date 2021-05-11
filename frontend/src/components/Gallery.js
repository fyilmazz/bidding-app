import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import ListSubheader from '@material-ui/core/ListSubheader';


const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
  },
  gridList: {
    width: 500,
    height: '100%',
    maxHeight: '100%'
  },
  icon: {
    color: 'rgba(255, 255, 255, 0.54)',
  },
}));

const TitlebarGridList = (data) => {
  const classes = useStyles();
  const { tileData, onClick, onSort } = data;

  return (
    <div className={classes.root}>
      <GridList cellHeight={180} className={classes.gridList}>
        <GridListTile key="Subheader" cols={2} style={{ height: 'auto' }}>
          <ListSubheader component="div"><span className={"pointer"} onClick={() => onSort()}>Sort by Price</span></ListSubheader>
        </GridListTile>
        {tileData.map((tile) => (
          <GridListTile key={tile.id}>
            <img src={tile.photo} alt={tile.name} />
            <GridListTileBar
              title={tile.name}
              subtitle={<span>Bid: {tile.bid}</span>}
              actionIcon={
                <button
                  className="btn btn-success mr-2"
                  onClick={() => onClick(tile)}
                >
                  Bid Now
                </button>
              }
            />
          </GridListTile>
        ))}
      </GridList>
    </div>
  );
};

export default TitlebarGridList;
